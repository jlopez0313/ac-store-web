<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Resources\VentaResource;

class VentasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = \App\Models\Venta::with(['local', 'detalles.producto', 'detalles.estanteria.bodega'])
            ->orderBy('id', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('local', function ($lq) use ($request) {
                    $lq->where('name', 'like', '%' . $request->search . '%');
                })->orWhere('id', 'like', '%' . $request->search . '%');
            });
        }

        // Locals are users with role 'local' who have at least one active access in bodega_accesos
        $locals = \App\Models\User::role('local')
            ->whereHas('bodegaAccesos')
            ->get(['id', 'name', 'cuenta_id'])
            ->map(function ($l) {
                $accessibleCuentas = \App\Models\BodegaAcceso::where('user_id', $l->id)
                    ->join('bodegas', 'bodega_accesos.bodega_id', '=', 'bodegas.id')
                    ->pluck('bodegas.cuenta_id')
                    ->unique()
                    ->values()
                    ->toArray();

                return [
                    'id' => $l->id,
                    'name' => $l->name,
                    'cuenta_id' => $l->cuenta_id,
                    'accessible_cuenta_ids' => $accessibleCuentas
                ];
            });

        $paginated = $query->paginate(10)->appends(request()->all());

        return Inertia::render('ventas/Index', [
            'filters' => request()->all(['search']),
            'lista' => VentaResource::collection($paginated),
            'next_id' => (\App\Models\Venta::max('id') ?? 0) + 1,
            'cuentas' => $isSuper ? \App\Models\Cuenta::all(['id', 'nombre']) : [],
            'locals' => $locals,
            // Removed full 'referencias' list to improve performance (now using search API)
            'bodegas' => \App\Models\Bodega::with('estanterias')->get(),
            'bodega_accesos' => \App\Models\BodegaAcceso::all(),
        ]);
    }

    /**
     * Search references with pagination and stock summaries.
     */
    public function searchReferences(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';
        $cuenta_id = $request->input('cuenta_id');

        $query = \App\Models\Referencia::with(['categoria', 'marca']);

        // Tenancy filtering
        if ($isSuper) {
            if ($cuenta_id) {
                $query->where('cuenta_id', $cuenta_id);
            }
        } else {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%")
                  ->orWhereHas('marca', function ($mq) use ($search) {
                      $mq->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        $paginated = $query->paginate(20);

        $data = collect($paginated->items())->map(function ($r) {
            $invs = \App\Models\Inventario::where('referencia_id', $r->id)
                ->join('estanterias', 'inventarios.estanteria_id', '=', 'estanterias.id')
                ->selectRaw('estanterias.bodega_id, inventarios.talla, SUM(inventarios.stock) as total_stock, MAX(inventarios.precio_venta) as max_precio')
                ->groupBy('estanterias.bodega_id', 'inventarios.talla')
                ->get();

            return [
                'id' => $r->id,
                'codigo' => $r->codigo,
                'marca' => $r->marca?->nombre,
                'descripcion' => $r->descripcion,
                'foto' => $r->foto,
                'categoria' => $r->categoria?->nombre,
                'cuenta_id' => $r->cuenta_id,
                'stock_global' => (int) $invs->sum('total_stock'),
                'total_tallas' => (int) $invs->pluck('talla')->unique()->count(),
                'precio_venta' => (float) $invs->max('max_precio'),
                'stock_breakdown' => $invs,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ]
        ]);
    }

    public function getStock(Request $request)
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
        ]);

        $stock = \App\Models\Inventario::where('referencia_id', $request->referencia_id)
            ->with(['estanteria.bodega'])
            ->where('stock', '>', 0)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'inventario',
                    'bodega_id' => $item->estanteria->bodega_id,
                    'bodega_nombre' => $item->estanteria->bodega->nombre,
                    'estanteria_id' => $item->estanteria_id,
                    'estanteria_nombre' => $item->estanteria->nombre,
                    'talla' => $item->talla,
                    'stock' => $item->stock,
                    'precio_venta' => $item->precio_venta,
                    'is_muestra' => false
                ];
            });

        // Get active samples for this reference (only for authorized roles)
        $muestras = collect();
        if (auth()->user()->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
            $muestras = \App\Models\Muestra::where('referencia_id', $request->referencia_id)
                ->where('estado', 'activo')
                ->with(['local', 'inventario'])
                ->get()
                ->map(function ($m) {
                    return [
                        'id' => $m->inventario_id, // Link to inventario if needed
                        'muestra_id' => $m->id,
                        'type' => 'muestra',
                        'bodega_id' => null,
                        'bodega_nombre' => "En Local: " . ($m->local->name ?? 'N/A'),
                        'estanteria_id' => null,
                        'estanteria_nombre' => 'Muestra Física',
                        'talla' => $m->variante,
                        'stock' => 1,
                        'precio_venta' => $m->inventario->precio_venta ?? 0,
                        'is_muestra' => true,
                        'etiquetas' => $m->etiquetas
                    ];
                });
        }

        return response()->json(['data' => $stock->concat($muestras)]);
    }

    public function addDetail(Request $request, \App\Models\Venta $venta)
    {
        $items = $request->input('items', []);

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden agregar productos a facturas abiertas.'], 422);
        }

        try {
            \DB::beginTransaction();

            foreach ($items as $item) {
                if (isset($item['muestra_id']) && $item['muestra_id']) {
                    $muestra = \App\Models\Muestra::findOrFail($item['muestra_id']);
                    if ($muestra->estado !== 'activo') {
                        throw new \Exception("La muestra ya no está activa.");
                    }
                    $muestra->update(['estado' => 'vendido']);
                    
                    $unitPrice = $item['precio_unitario'];
                    $venta->detalles()->create([
                        'inventario_id' => $muestra->inventario_id,
                        'producto_id' => $muestra->referencia_id,
                        'bodega_id' => $muestra->inventario->estanteria->bodega_id ?? null,
                        'estanteria_id' => $muestra->inventario->estanteria_id ?? null,
                        'talla' => $muestra->variante,
                        'cantidad' => 1,
                        'precio_unitario' => $unitPrice,
                        'subtotal' => $unitPrice,
                        'muestra_id' => $muestra->id
                    ]);
                    $venta->increment('total', $unitPrice);
                } else {
                    $inv = \App\Models\Inventario::with('estanteria')->findOrFail($item['inventario_id']);

                    if ($inv->stock < $item['cantidad']) {
                        throw new \Exception("Stock insuficiente en el estante " . ($inv->estanteria->nombre ?? 'N/A'));
                    }

                    $inv->decrement('stock', $item['cantidad']);

                    $unitPrice = $item['precio_unitario'];

                    for ($i = 0; $i < $item['cantidad']; $i++) {
                        $venta->detalles()->create([
                            'inventario_id' => $inv->id,
                            'producto_id' => $inv->referencia_id,
                            'bodega_id' => $inv->estanteria->bodega_id,
                            'estanteria_id' => $inv->estanteria_id,
                            'talla' => $inv->talla,
                            'cantidad' => 1,
                            'precio_unitario' => $unitPrice,
                            'subtotal' => $unitPrice,
                        ]);
                    }
                    $venta->increment('total', $item['cantidad'] * $unitPrice);
                }
            }

            \DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));

            return response()->json([
                'message' => 'Productos agregados correctamente.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function updateDetail(Request $request, \App\Models\Venta $venta, \App\Models\VentaDetalle $detalle)
    {
        $request->validate([
            'precio_unitario' => 'required|numeric|min:0',
        ]);

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden modificar precios en facturas abiertas.'], 422);
        }

        try {
            \DB::beginTransaction();

            $oldSubtotal = $detalle->subtotal;
            $newSubtotal = $detalle->cantidad * $request->precio_unitario;

            $detalle->update([
                'precio_unitario' => $request->precio_unitario,
                'subtotal' => $newSubtotal,
            ]);

            $venta->decrement('total', $oldSubtotal);
            $venta->increment('total', $newSubtotal);

            \DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));

            return response()->json([
                'message' => 'Precio actualizado correctamente.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }    public function bulkDeleteDetails(Request $request, \App\Models\Venta $venta)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:venta_detalles,id',
            'observacion' => 'required|string'
        ]);

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden eliminar productos de facturas abiertas.'], 422);
        }

        try {
            \DB::beginTransaction();

            foreach ($request->ids as $id) {
                $detalle = \App\Models\VentaDetalle::find($id);
                if (!$detalle || $detalle->venta_id !== $venta->id) continue;
                $this->processDetailDeletion($venta, $detalle, $request->observacion);
            }

            \DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));
            return response()->json([
                'message' => 'Productos eliminados y stock restaurado.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function deleteDetail(Request $request, \App\Models\Venta $venta, \App\Models\VentaDetalle $detalle)
    {
        $request->validate([
            'observacion' => 'required|string'
        ]);

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden eliminar productos de facturas abiertas.'], 422);
        }

        try {
            \DB::beginTransaction();

            $this->processDetailDeletion($venta, $detalle, $request->observacion);

            \DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));

            return response()->json([
                'message' => 'Producto eliminado y stock restaurado.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    private function processDetailDeletion(\App\Models\Venta $venta, \App\Models\VentaDetalle $detalle, string $observacion = '')
    {
        if ($detalle->muestra_id) {
            $muestra = \App\Models\Muestra::find($detalle->muestra_id);
            if ($muestra) {
                $muestra->update(['estado' => 'activo']);
            }
        } else {
            // Restore inventory
            $inv = \App\Models\Inventario::find($detalle->inventario_id);
            
            // Fallback for old records
            if (!$inv) {
                $inv = \App\Models\Inventario::where([
                    'referencia_id' => $detalle->producto_id,
                    'estanteria_id' => $detalle->estanteria_id,
                    'talla' => $detalle->talla
                ])->first();
            }

            if ($inv) {
                $inv->increment('stock', $detalle->cantidad);
            }
        }

        $venta->decrement('total', $detalle->subtotal);
        $detalle->update(['observacion' => $observacion]);
        $detalle->delete();
    }

    public function closeVenta(\App\Models\Venta $venta)
    {
        if (!auth()->user()->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
            if (request()->wantsJson()) {
                return response()->json(['error' => 'No tiene permisos para cerrar facturas.'], 403);
            }
            return back()->withErrors(['error' => 'No tiene permisos para cerrar facturas.']);
        }

        if ($venta->detalles()->count() === 0) {
            if (request()->wantsJson()) {
                return response()->json(['error' => 'No se puede cerrar una factura sin productos.'], 422);
            }
            return back()->withErrors(['error' => 'No se puede cerrar una factura sin productos.']);
        }

        $venta->update(['estado' => 'cerrada']);

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Factura cerrada correctamente.', 'data' => $venta]);
        }

        return back()->with('success', 'Factura cerrada correctamente.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required', // Expected to be array when multiple=true in frontend
            'cuenta_id' => auth()->user()->role === 'superadmin' ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        $user = auth()->user();
        $cuenta_id = $user->role === 'superadmin' ? $request->cuenta_id : $user->cuenta_id;

        $userIds = is_array($request->user_id) ? $request->user_id : [$request->user_id];

        if (empty($userIds)) {
            return redirect()->back()->with('error', 'Debe seleccionar al menos un local.');
        }

        \DB::transaction(function () use ($userIds, $cuenta_id, $request) {
            foreach ($userIds as $userId) {
                // Skip 'ALL' value if it somehow reaches the backend
                if ($userId === 'ALL')
                    continue;

                \App\Models\Venta::create([
                    'user_id' => $userId,
                    'cuenta_id' => $cuenta_id,
                    'fecha' => now()->format('Y-m-d'),
                    'estado' => 'abierta',
                    'observaciones' => $request->observaciones,
                ]);
            }
        });

        $msg = count($userIds) === 1 ? 'Factura de venta creada correctamente.' : count($userIds) . ' Facturas de venta creadas correctamente.';
        return redirect()->back()->with('success', $msg);
    }
    public function updateBulkDiscounts(Request $request, \App\Models\Venta $venta)
    {
        $request->validate([
            'discounts' => 'required|array',
            'discounts.*' => 'required|numeric|min:0',
        ]);

        $discounts = $request->discounts;

        foreach ($discounts as $producto_id => $discount_value) {
            $detalles = \App\Models\VentaDetalle::with('inventario')
                ->where('venta_id', $venta->id)
                ->where('producto_id', $producto_id)
                ->get();

            foreach ($detalles as $detalle) {
                /** @var \App\Models\VentaDetalle $detalle */
                // precio_sugerido is mapped from inventario->precio_venta in VentaResource
                $base_price = $detalle->inventario->precio_venta ?? 0;
                $new_precio_unitario = max(0, $base_price - $discount_value);
                
                $detalle->update([
                    'precio_unitario' => $new_precio_unitario,
                    'subtotal' => $new_precio_unitario * $detalle->cantidad,
                ]);
            }
        }

        // Recalculate invoice total
        $total = \App\Models\VentaDetalle::where('venta_id', $venta->id)->sum('subtotal');
        $venta->update(['total' => $total]);

        return redirect()->back()->with('success', 'Descuentos aplicados correctamente');
    }
}
