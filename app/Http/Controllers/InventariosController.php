<?php

namespace App\Http\Controllers;

use App\Http\Resources\InventarioResource;
use App\Models\Inventario;
use App\Models\Referencia;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventariosController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('inventario/Index', [
            'filters' => $request->only(['search', 'per_page', 'sort_field', 'sort_order']),
        ]);
    }

    public function detail(Referencia $referencia)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Inventario::where('referencia_id', $referencia->id)
            ->with(['estanteria.bodega'])
            ->orderBy('stock', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        return response()->json([
            'data' => InventarioResource::collection($query->get())
        ]);
    }

    public function ajustar(Request $request)
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
            'estanteria_id' => 'required|exists:estanterias,id',
            'precio_compra' => 'required|integer|min:0',
            'precio_venta' => 'required|integer|min:0',
            'observacion' => 'nullable|string',
            'detalles' => 'required|array',
            'detalles.*.talla' => 'required|string',
            'detalles.*.stock' => 'required|integer|min:0',
        ]);

        return \DB::transaction(function () use ($request) {
            $user = auth()->user();
            $referenciaId = $request->referencia_id;
            $estanteriaId = $request->estanteria_id;

            // 1. Snapshot old global prices
            $firstRecord = Inventario::where('referencia_id', $referenciaId)
                ->where('estanteria_id', $estanteriaId)
                ->first();

            $precioCompraAnterior = $firstRecord ? $firstRecord->precio_compra : 0;
            $precioVentaAnterior = $firstRecord ? $firstRecord->precio_venta : 0;

            // 2. Update global prices for ALL records of this ref/shelf
            Inventario::where('referencia_id', $referenciaId)
                ->where('estanteria_id', $estanteriaId)
                ->update([
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
                ]);

            // 3. Process stock adjustments
            $detalleStockLog = [];
            foreach ($request->detalles as $det) {
                $inv = Inventario::firstOrNew([
                    'referencia_id' => $referenciaId,
                    'estanteria_id' => $estanteriaId,
                    'talla' => $det['talla'],
                ]);

                if (!$inv->exists) {
                    $ref = Referencia::find($referenciaId);
                    $inv->cuenta_id = $ref->cuenta_id;
                }

                $stockAnterior = $inv->stock ?? 0;
                $inv->stock = $det['stock'];
                $inv->precio_compra = $request->precio_compra;
                $inv->precio_venta = $request->precio_venta;
                $inv->save();

                $detalleStockLog[] = [
                    'talla' => $det['talla'],
                    'anterior' => $stockAnterior,
                    'nuevo' => $det['stock'],
                ];
            }

            // 4. Create Audit Log
            \App\Models\AjusteInventario::create([
                'referencia_id' => $referenciaId,
                'estanteria_id' => $estanteriaId,
                'precio_compra_anterior' => $precioCompraAnterior,
                'precio_compra_nuevo' => $request->precio_compra,
                'precio_venta_anterior' => $precioVentaAnterior,
                'precio_venta_nuevo' => $request->precio_venta,
                'detalle_stock' => $detalleStockLog,
                'observacion' => $request->observacion,
            ]);

            return response()->json(['message' => 'Inventario ajustado correctamente']);
        });
    }
}
