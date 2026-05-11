<?php

namespace App\Http\Controllers;

use App\Http\Resources\CajaResource;
use App\Models\Bodega;
use App\Models\Caja;
use App\Models\Inventario;
use App\Models\Traslado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CajasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Caja::with(['referencia.categoria', 'bodega', 'compra'])->orderBy('id', 'desc');

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referencia', function ($rq) use ($search) {
                    $rq->where('codigo', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%")
                        ->orWhereHas('marca', function ($mq) use ($search) {
                            $mq->where('nombre', 'like', "%{$search}%");
                        });
                });
            });
        }

        $bodegasQuery = Bodega::with('estanterias')->orderBy('nombre');
        if (!$user->hasRole('superadmin')) {
            $bodegasQuery->where('cuenta_id', $user->cuenta_id);
        }

        return Inertia::render('cajas/Index', [
            'filters' => $request->only(['search', 'per_page']),
            'lista' => CajaResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
            'bodegas' => $bodegasQuery->get(),
        ]);
    }

    public function tallar(Request $request, Caja $caja)
    {
        $request->validate([
            'estanteria_id' => 'nullable|exists:estanterias,id',
            'tallas' => 'required|array|min:1',
            'tallas.*.size' => 'required',
            'tallas.*.qty' => 'required|integer|min:1',
            'tallas.*.estanteria_id' => 'nullable|exists:estanterias,id',
        ]);

        $totalTallado = collect($request->tallas)->sum('qty');

        if ($totalTallado > $caja->cantidad) {
            return back()->withErrors(['error' => 'La cantidad a tallar supera el disponible en la caja.']);
        }

        try {
            DB::beginTransaction();

            foreach ($request->tallas as $item) {
                $estanteriaId = $request->input('estanteria_id') ?: ($item['estanteria_id'] ?? null);

                if (!$estanteriaId) {
                    throw new \Exception("No se ha especificado la estantería de destino para la talla " . $item['size']);
                }

                // 1. Update or create Inventory record
                $inventario = Inventario::firstOrCreate(
                    [
                        'cuenta_id' => $caja->cuenta_id,
                        'referencia_id' => $caja->referencia_id,
                        'talla' => $item['size'],
                        'estanteria_id' => $estanteriaId,
                    ],
                    [
                        'stock' => 0,
                        'precio_compra' => $caja->precio_compra,
                        'precio_venta' => $caja->precio_venta,
                    ]
                );

                $inventario->increment('stock', $item['qty']);

                // 2. Register Transfer History
                $inventario->load('estanteria');
                Traslado::create([
                    'cuenta_id' => $caja->cuenta_id,
                    'referencia_id' => $caja->referencia_id,
                    'talla' => $item['size'],
                    'bodega_origen_id' => $caja->bodega_id,
                    'estanteria_origen_id' => null, // NULL for boxes
                    'bodega_destino_id' => $inventario->estanteria->bodega_id,
                    'estanteria_destino_id' => $estanteriaId,
                    'cantidad' => $item['qty'],
                    'user_id' => auth()->id(),
                ]);
            }

            // 3. Update or remove Caja record
            if ($totalTallado == $caja->cantidad) {
                $caja->delete();
            } else {
                $caja->decrement('cantidad', $totalTallado);
            }

            // 4. Mark all samples as already printed (true)
            \App\Models\Muestra::where('cuenta_id', $caja->cuenta_id)->update(['impreso' => true]);

            DB::commit();
            return back()->with('success', 'Producto tallado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al procesar el tallado: ' . $e->getMessage()]);
        }
    }
}
