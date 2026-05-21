<?php

namespace App\Http\Controllers;

use App\Http\Resources\TrasladoResource;
use App\Models\Bodega;
use App\Models\Cuenta;
use App\Models\Estanteria;
use App\Models\Inventario;
use App\Models\Referencia;
use App\Models\Traslado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TrasladosController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Traslado::with(['referencia', 'bodegaOrigen', 'estanteriaOrigen', 'bodegaDestino', 'estanteriaDestino', 'usuario'])
            ->orderBy('id', 'desc');

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referencia', function ($rq) use ($search) {
                    $rq->where('codigo', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%");
                })->orWhereHas('usuario', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%");
                });
            });
        }

        return Inertia::render('traslados/Index', [
            'filters' => $request->only(['search', 'per_page']),
            'lista' => TrasladoResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
            'cuentas' => $user->hasRole('superadmin') ? Cuenta::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre as name']) : [],
            'referencias' => !$user->hasRole('superadmin') ? Referencia::where('cuenta_id', $user->cuenta_id)->orderBy('codigo')->get(['id', 'codigo', 'descripcion', 'foto']) : [],
        ]);
    }

    public function show(Traslado $traslado)
    {
        return new TrasladoResource($traslado->load(['referencia.marca', 'bodegaOrigen', 'estanteriaOrigen', 'bodegaDestino', 'estanteriaDestino', 'usuario']));
    }

    public function getReferenciasByCuenta(Request $request)
    {
        $request->validate(['cuenta_id' => 'required|exists:cuentas,id']);
        return response()->json(Referencia::where('cuenta_id', $request->cuenta_id)->orderBy('codigo')->get(['id', 'codigo', 'descripcion', 'foto']));
    }

    public function getBodegasByCuenta(Request $request)
    {
        $request->validate(['cuenta_id' => 'required|exists:cuentas,id']);
        return response()->json(Bodega::where('cuenta_id', $request->cuenta_id)->orderBy('nombre')->get(['id', 'nombre']));
    }

    public function getEstanteriasByBodega(Request $request)
    {
        $request->validate(['bodega_id' => 'required|exists:bodegas,id']);
        return response()->json(Estanteria::where('bodega_id', $request->bodega_id)->orderBy('nombre')->get(['id', 'nombre']));
    }

    public function getInventoryByReference(Request $request)
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
        ]);

        $query = Inventario::with(['estanteria.bodega'])
            ->where('referencia_id', $request->referencia_id)
            ->where('stock', '>', 0);
        
        if ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        } else if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        $inventario = $query->get()->map(function($item) {
            return [
                'id' => $item->id,
                'talla' => $item->talla,
                'stock' => $item->stock,
                'bodega_id' => $item->estanteria->bodega_id,
                'bodega_nombre' => $item->estanteria->bodega->nombre,
                'estanteria_id' => $item->estanteria_id,
                'estanteria_nombre' => $item->estanteria->nombre,
            ];
        });

        return response()->json($inventario);
    }

    public function store(Request $request)
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
            'talla' => 'nullable',
            'estanteria_origen_id' => 'required|exists:estanterias,id',
            'estanteria_destino_id' => 'required|exists:estanterias,id',
            'cantidad' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $cuenta_id = $request->input('cuenta_id', auth()->user()->cuenta_id);

            // Determine sizes and quantities to transfer
            $itemsATrasladar = [];
            if (empty($request->talla)) {
                $inventariosOrigen = Inventario::with('estanteria')
                    ->where('referencia_id', $request->referencia_id)
                    ->where('estanteria_id', $request->estanteria_origen_id)
                    ->where('cuenta_id', $cuenta_id)
                    ->where('stock', '>', 0)
                    ->get();

                if ($inventariosOrigen->isEmpty()) {
                    DB::rollBack();
                    return back()->withErrors(['cantidad' => 'No hay stock disponible en el origen.']);
                }

                $totalStockDisponible = $inventariosOrigen->sum('stock');
                if ($request->cantidad != $totalStockDisponible) {
                    DB::rollBack();
                    return back()->withErrors(['cantidad' => 'Para un traslado parcial, debe seleccionar una talla específica.']);
                }

                foreach ($inventariosOrigen as $item) {
                    $itemsATrasladar[] = [
                        'talla' => $item->talla,
                        'cantidad' => $item->stock,
                        'origen' => $item,
                    ];
                }
            } else {
                $origen = Inventario::with('estanteria')->where('referencia_id', $request->referencia_id)
                    ->where('talla', $request->talla)
                    ->where('estanteria_id', $request->estanteria_origen_id)
                    ->where('cuenta_id', $cuenta_id)
                    ->first();

                if (!$origen || $origen->stock < $request->cantidad) {
                    DB::rollBack();
                    return back()->withErrors(['cantidad' => 'Stock insuficiente en el origen.']);
                }

                $itemsATrasladar[] = [
                    'talla' => $request->talla,
                    'cantidad' => $request->cantidad,
                    'origen' => $origen,
                ];
            }

            $trasladosCreados = [];
            foreach ($itemsATrasladar as $trans) {
                $origenItem = $trans['origen'];
                $tallaItem = $trans['talla'];
                $cantItem = $trans['cantidad'];

                // 2. Decrement source
                $origenItem->decrement('stock', $cantItem);

                // 3. Get or create destination inventory
                $destinoItem = Inventario::firstOrCreate(
                    [
                        'referencia_id' => $request->referencia_id,
                        'talla' => $tallaItem,
                        'estanteria_id' => $request->estanteria_destino_id,
                        'cuenta_id' => $cuenta_id,
                    ],
                    [
                        'stock' => 0,
                        'precio_compra' => $origenItem->precio_compra,
                        'precio_venta' => $origenItem->precio_venta,
                    ]
                );

                $destinoItem->increment('stock', $cantItem);
                $destinoItem->load('estanteria');

                // 4. Create traslado log
                $traslado = Traslado::create([
                    'cuenta_id' => $cuenta_id,
                    'referencia_id' => $request->referencia_id,
                    'talla' => $tallaItem,
                    'bodega_origen_id' => $origenItem->estanteria->bodega_id,
                    'estanteria_origen_id' => $request->estanteria_origen_id,
                    'bodega_destino_id' => $destinoItem->estanteria->bodega_id,
                    'estanteria_destino_id' => $request->estanteria_destino_id,
                    'cantidad' => $cantItem,
                    'user_id' => auth()->id(),
                ]);

                $trasladosCreados[] = $traslado;
            }

            // 5. Notify Firebase if destination bodega requires printing
            foreach ($trasladosCreados as $t) {
                $bodegaDestino = Bodega::find($t->bodega_destino_id);
                if ($bodegaDestino && $bodegaDestino->imprimir_traslados) {
                    try {
                        $firebase = app('firebase.database');
                        $firebase->getReference("print_requests/{$cuenta_id}")->push([
                            'type' => 'traslado',
                            'traslado_id' => $t->id,
                            'created_at' => now()->timestamp * 1000,
                            'local_name' => $bodegaDestino->nombre,
                        ]);
                    } catch (\Exception $e) {
                        \Log::error("Error pushing traslado to Firebase: " . $e->getMessage());
                    }
                }
            }

            DB::commit();

            return back()->with('success', 'Traslado realizado con éxito.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Ocurrió un error al procesar el traslado: ' . $e->getMessage()]);
        }
    }
}
