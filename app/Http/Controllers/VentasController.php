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

        $query = \App\Models\Venta::with(['local', 'vendedor', 'detalles.producto', 'detalles.estanteria.bodega'])
            ->orderBy('id', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('local', function ($lq) use ($request) {
                    $lq->where('name', 'like', '%' . $request->search . '%');
                })->orWhere('numero', 'like', '%' . $request->search . '%');
            });
        }

        // Locals are users with role 'local' who have at least one active access in bodega_accesos
        $locals = \App\Models\User::role('local')
            ->whereHas('bodegaAccesos')
            ->orderBy('name')
            ->get(['id', 'name', 'cuenta_id', 'maneja_vendedores'])
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
                    'accessible_cuenta_ids' => $accessibleCuentas,
                    'maneja_vendedores' => (bool) $l->maneja_vendedores
                ];
            });

        $paginated = $query->paginate(10)->appends(request()->all());

        return Inertia::render('ventas/Index', [
            'filters' => request()->all(['search']),
            'lista' => VentaResource::collection($paginated),
            'next_id' => (\App\Models\Venta::where('cuenta_id', $isSuper ? request('cuenta_id') : $user->cuenta_id)->max('numero') ?? 0) + 1,
            'cuentas' => $isSuper ? \App\Models\Cuenta::all(['id', 'nombre']) : [],
            'locals' => $locals,
            // Removed full 'referencias' list to improve performance (now using search API)
            'bodegas' => \App\Models\Bodega::with('estanterias')->get(),
            'bodega_accesos' => \App\Models\BodegaAcceso::all(),
            'vendedores' => \App\Models\Vendedor::where('estado', true)->get(['id', 'nombre', 'user_id', 'cuenta_id']),
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
                if (is_numeric($search)) {
                    $q->where('numero', $search);
                } else {
                    $q->whereHas('marca', function ($mq) use ($search) {
                        $mq->where('nombre', 'like', '%' . $search . '%');
                    });
                }
            });
        }

        $paginated = $query->paginate(20);

        $data = collect($paginated->items())->map(function ($r) use ($user) {
            $invsQuery = \App\Models\Inventario::where('referencia_id', $r->id)
                ->join('estanterias', 'inventarios.estanteria_id', '=', 'estanterias.id');

            // Only 'local' users are restricted to their allowed bodegas
            if ($user->role === 'local') {
                $allowedBodegas = \App\Models\BodegaAcceso::where('user_id', $user->id)->pluck('bodega_id');
                $invsQuery->whereIn('estanterias.bodega_id', $allowedBodegas);
            }

            $invs = $invsQuery->selectRaw('estanterias.bodega_id, inventarios.talla, SUM(inventarios.stock) as total_stock, MAX(inventarios.precio_venta) as max_precio')
                ->groupBy('estanterias.bodega_id', 'inventarios.talla')
                ->get();

            // Count active samples
            $muestrasQuery = \App\Models\Muestra::where('referencia_id', $r->id)
                ->where('estado', 'activo');

            if (!$user->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
                $muestrasQuery->where('local_id', $user->id);
            }

            $muestrasCount = $muestrasQuery->count();
            $muestrasTallas = $muestrasQuery->pluck('variante')->unique();

            $allTallas = $invs->pluck('talla')->concat($muestrasTallas)->unique();

            return [
                'id' => $r->id,
                'codigo' => $r->codigo,
                'marca' => $r->marca?->nombre,
                'descripcion' => $r->descripcion,
                'foto' => $r->foto,
                'categoria' => $r->categoria?->nombre,
                'cuenta_id' => $r->cuenta_id,
                'stock_global' => (int) $invs->sum('total_stock') + $muestrasCount,
                'total_tallas' => (int) $allTallas->count(),
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

        $user = auth()->user();
        $stockQuery = \App\Models\Inventario::where('referencia_id', $request->referencia_id)
            ->with(['estanteria.bodega'])
            ->where('stock', '>', 0);

        // Only 'local' users are restricted to their allowed bodegas
        if ($user->role === 'local') {
            $allowedBodegas = \App\Models\BodegaAcceso::where('user_id', $user->id)->pluck('bodega_id');
            $stockQuery->whereHas('estanteria', function ($q) use ($allowedBodegas) {
                $q->whereIn('bodega_id', $allowedBodegas);
            });
        }

        $stock = $stockQuery->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'inventario',
                    'bodega_id' => $item->estanteria->bodega_id,
                    'bodega_nombre' => $item->estanteria->bodega?->nombre ?? 'N/A',
                    'estanteria_id' => $item->estanteria_id,
                    'estanteria_nombre' => $item->estanteria->nombre,
                    'talla' => $item->talla,
                    'stock' => $item->stock,
                    'precio_venta' => $item->precio_venta,
                    'is_muestra' => false,
                    'es_caja' => false
                ];
            });

        // Add boxes if the user is NOT a local
        if ($user->role !== 'local') {
            $cajas = \App\Models\Caja::where('referencia_id', $request->referencia_id)
                ->with(['bodega'])
                ->where('cantidad', '>', 0)
                ->get()
                ->map(function ($caja) {
                    return [
                        'id' => $caja->id,
                        'type' => 'caja',
                        'bodega_id' => $caja->bodega_id,
                        'bodega_nombre' => $caja->bodega?->nombre ?? 'N/A',
                        'estanteria_id' => null,
                        'estanteria_nombre' => 'Caja Completa',
                        'talla' => 'C',
                        'stock' => $caja->cantidad, // number of boxes
                        'pares_por_caja' => $caja->pares_por_caja,
                        'precio_venta' => $caja->precio_venta, // price per pair
                        'is_muestra' => false,
                        'es_caja' => true
                    ];
                });
            $stock = $stock->concat($cajas);
        }

        // Get active samples for this reference
        $user = auth()->user();
        $muestrasQuery = \App\Models\Muestra::where('referencia_id', $request->referencia_id)
            ->where('estado', 'activo')
            ->with(['local', 'inventario']);

        if (!$user->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
            // Local users only see samples assigned to them
            $muestrasQuery->where('local_id', $user->id);
        }

        $muestras = $muestrasQuery->get()->map(function ($m) {
            $etiquetas = $m->etiquetas ?: [];
            if ($m->variante && !in_array($m->variante, $etiquetas)) {
                $etiquetas[] = $m->variante;
            }

            return [
                'id' => $m->inventario_id,
                'muestra_id' => $m->id,
                'type' => 'muestra',
                'bodega_id' => null,
                'bodega_nombre' => ($m->local->name ?? 'N/A'),
                'estanteria_id' => null,
                'estanteria_nombre' => 'Muestra Física',
                'talla' => $m->inventario->talla ?? $m->variante,
                'talla_muestra' => $m->variante, // Keep the original side info
                'stock' => 1,
                'precio_venta' => $m->inventario->precio_venta ?? 0,
                'is_muestra' => true,
                'etiquetas' => $etiquetas
            ];
        });

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
                } elseif (isset($item['es_caja']) && $item['es_caja']) {
                    $caja = \App\Models\Caja::findOrFail($item['id']);
                    $totalUnidades = (int) $item['cantidad']; // Already pairs from frontend

                    if ($caja->cantidad < $totalUnidades) {
                        throw new \Exception("Stock de unidades en cajas insuficiente.");
                    }

                    $caja->decrement('cantidad', $totalUnidades);

                    $unitPrice = (float) $item['precio_unitario'];
                    $subtotal = $totalUnidades * $unitPrice;

                    $venta->detalles()->create([
                        'caja_id' => $caja->id,
                        'es_caja' => true,
                        'producto_id' => $caja->referencia_id,
                        'bodega_id' => $caja->bodega_id,
                        'talla' => 'C',
                        'cantidad' => $totalUnidades,
                        'precio_unitario' => $unitPrice,
                        'subtotal' => $subtotal,
                        'observacion' => "Venta desde Caja #{$caja->id}"
                    ]);
                    $venta->increment('total', $subtotal);
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
                            'numero' => $venta->numero,
                            'talla' => $inv->talla,
                            'cantidad' => 1,
                            'precio_unitario' => $unitPrice,
                            'subtotal' => $unitPrice,
                        ]);
                    }
                    $venta->increment('total', $unitPrice * $item['cantidad']);
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
    }
    public function bulkDeleteDetails(Request $request, \App\Models\Venta $venta)
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
                if (!$detalle || $detalle->venta_id !== $venta->id)
                    continue;
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
        } elseif ($detalle->es_caja && $detalle->caja_id) {
            // Restore box stock (stored as pairs)
            $caja = \App\Models\Caja::find($detalle->caja_id);
            if ($caja) {
                $caja->increment('cantidad', $detalle->cantidad);
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

    public function updateObservaciones(Request $request, \App\Models\Venta $venta)
    {
        $request->validate([
            'observaciones' => 'nullable|string',
            'observaciones_local' => 'nullable|string',
        ]);

        $venta->update($request->only(['observaciones', 'observaciones_local']));

        return response()->json([
            'message' => 'Observaciones actualizadas correctamente.',
            'data' => $venta
        ]);
    }

    public function closeVenta(\App\Models\Venta $venta)
    {
        if (!auth()->user()->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
            if (request()->wantsJson()) {
                return response()->json(['error' => 'No tiene permisos para cerrar facturas.'], 403);
            }
            return back()->withErrors(['error' => 'No tiene permisos para cerrar facturas.']);
        }

        // Allow closing empty invoices as per user request

        $venta->update(['estado' => 'cerrada']);

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Factura cerrada correctamente.', 'data' => $venta]);
        }

        return back()->with('success', 'Factura cerrada correctamente.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required',
            'vendedor_ids' => 'nullable|array',
            'cuenta_id' => auth()->user()->role === 'superadmin' ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        $user = auth()->user();
        $cuenta_id = $user->role === 'superadmin' ? $request->cuenta_id : $user->cuenta_id;

        $userIds = is_array($request->user_id) ? $request->user_id : [$request->user_id];

        if (empty($userIds)) {
            return redirect()->back()->with('error', 'Debe seleccionar al menos un local.');
        }

        \DB::transaction(function () use ($userIds, $cuenta_id, $request) {
            $nextNumero = \App\Models\Venta::where('cuenta_id', $cuenta_id)->max('numero') ?? 0;

            foreach ($userIds as $userId) {
                if ($userId === 'ALL')
                    continue;

                $local = \App\Models\User::find($userId);
                if (!$local)
                    continue;

                // Check if local manages sellers and has any
                if ($local->maneja_vendedores) {
                    $vendedores = \App\Models\Vendedor::where('user_id', $local->id)
                        ->where('estado', true)
                        ->when($request->filled('vendedor_ids'), function ($q) use ($request) {
                            return $q->whereIn('id', $request->vendedor_ids);
                        })
                        ->get();

                    if ($vendedores->count() > 0) {
                        foreach ($vendedores as $vendedor) {
                            $nextNumero++;
                            \App\Models\Venta::create([
                                'numero' => $nextNumero,
                                'user_id' => $local->id,
                                'vendedor_id' => $vendedor->id,
                                'cuenta_id' => $cuenta_id,
                                'fecha' => now()->format('Y-m-d'),
                                'estado' => 'abierta',
                                'observaciones' => $request->observaciones,
                            ]);
                        }
                        continue; // Skip creating a general invoice for this local
                    }
                }

                // Default: Create one invoice for the local
                $nextNumero++;
                \App\Models\Venta::create([
                    'numero' => $nextNumero,
                    'user_id' => $local->id,
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
