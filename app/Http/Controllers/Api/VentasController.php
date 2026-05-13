<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VentaResource;
use App\Http\Resources\VentaDetalleResource;
use App\Models\Venta;
use App\Models\Referencia;
use App\Models\Inventario;
use App\Models\Muestra;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $sortField = $request->input('sort_field', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Venta::with(['local', 'cuenta']);

        if (!$isSuper) {
            if ($user->role === 'local') {
                $query->where('user_id', $user->id);
            } else {
                $query->where('cuenta_id', $user->cuenta_id);
            }
        } else if ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('local_id')) {
            $query->where('user_id', $request->local_id);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                // Exact Numero match if numeric
                if (is_numeric($search)) {
                    $q->where('numero', $search);
                } else {
                    $q->whereHas('local', function ($lq) use ($search) {
                        $lq->where('name', 'like', '%' . $search . '%');
                    });
                }
            });
        }

        $paginated = $query->orderBy($sortField, $sortOrder)
            ->paginate($request->input('per_page', 10));

        return VentaResource::collection($paginated);
    }

    public function show(Venta $venta)
    {
        return new VentaResource($venta->load(['local', 'detalles.producto', 'detalles.estanteria.bodega']));
    }

    public function searchReferences(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';
        $cuenta_id = $request->input('cuenta_id');

        $query = Referencia::with(['categoria', 'marca']);

        if ($isSuper) {
            if ($cuenta_id) {
                $query->where('cuenta_id', $cuenta_id);
            }
        } else {
            $query->whereIn('cuenta_id', $user->getAccessibleAccountIds());
        }

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

        if ($request->filled('bodega_id')) {
            $query->whereHas('inventarios', function ($q) use ($request) {
                $q->where('stock', '>', 0)
                    ->whereHas('estanteria', function ($eq) use ($request) {
                        $eq->where('bodega_id', $request->bodega_id);
                    });
            });
        } else if ($request->filled('talla')) {
            $query->whereHas('inventarios', function ($q) use ($request) {
                $q->where('talla', $request->talla)
                    ->where('stock', '>', 0);
            });
        }

        $paginated = $query->paginate(20);

        $data = collect($paginated->items())->map(function ($r) {
            $invs = Inventario::where('referencia_id', $r->id)
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

        $stock = Inventario::where('referencia_id', $request->referencia_id)
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

        $muestras = collect();
        $user = auth()->user();

        if ($user->hasAnyRole(['admin', 'bodega', 'superadmin', 'local'])) {
            $query = Muestra::where('referencia_id', $request->referencia_id)
                ->where('estado', 'activo')
                ->with(['local', 'inventario']);

            if ($user->hasRole('local')) {
                $query->where('local_id', $user->id);
            }

            $muestras = $query->get()
                ->map(function ($m) {
                    return [
                        'id' => $m->inventario_id,
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



    public function updateObservaciones(Request $request, Venta $venta)
    {
        $request->validate([
            'observaciones' => 'nullable|string',
            'observaciones_local' => 'nullable|string',
        ]);

        $venta->update($request->only(['observaciones', 'observaciones_local']));

        return response()->json([
            'message' => 'Observaciones actualizadas correctamente.',
            'data' => new VentaResource($venta->fresh(['local', 'detalles.producto', 'detalles.estanteria.bodega']))
        ]);
    }

    public function reopenVenta(Request $request, Venta $venta)
    {
        $user = auth()->user();

        // Security check: only admin or superadmin
        if (!$user->hasRole('superadmin') && $user->role !== 'admin') {
            abort(403, 'No tienes permiso para reabrir facturas.');
        }

        // Account security check
        if (!$user->hasRole('superadmin') && $user->cuenta_id !== $venta->cuenta_id) {
            abort(403, 'No tienes permiso para reabrir esta factura.');
        }

        if ($venta->estado !== 'cerrada') {
            return response()->json(['error' => 'La factura no está cerrada'], 400);
        }

        $validated = $request->validate([
            'observacion' => 'required|string|min:5'
        ]);

        $observacionDate = now()->format('Y-m-d H:i');
        $nuevaObservacion = "{$observacionDate} ({$user->name}) [REAPERTURA]: {$validated['observacion']}";

        $observacionesActuales = $venta->observaciones ? $venta->observaciones . "\n" : "";

        $venta->update([
            'estado' => 'abierta',
            'observaciones' => $observacionesActuales . $nuevaObservacion
        ]);

        return response()->json(['message' => 'Factura reabierta correctamente', 'data' => $venta->fresh()]);
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
            return response()->json(['error' => 'Debe seleccionar al menos un local.'], 422);
        }

        DB::transaction(function () use ($userIds, $cuenta_id, $request) {
            foreach ($userIds as $userId) {
                if ($userId === 'ALL')
                    continue;

                Venta::create([
                    'user_id' => $userId,
                    'cuenta_id' => $cuenta_id,
                    'fecha' => now(),
                    'estado' => 'abierta',
                    'observaciones' => $request->observaciones,
                ]);
            }
        });

        return response()->json(['message' => 'Factura(s) creada(s) correctamente.']);
    }

    public function addDetail(Request $request, Venta $venta)
    {
        $items = $request->input('items', []);
        $user = auth()->user();

        // Advanced restriction for Local role: Schedule + Holidays
        $service = new \App\Services\TimeRestrictionService();
        if (!$service->canUserOperate($user)) {
            $msg = $service->isColombianHoliday(now())
                ? 'No se permiten adiciones los días festivos.'
                : 'Operación fuera del horario permitido para su local.';
            return response()->json(['error' => $msg], 403);
        }

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden agregar productos a facturas abiertas.'], 422);
        }

        try {
            DB::beginTransaction();

            foreach ($items as $item) {
                if (isset($item['muestra_id']) && $item['muestra_id']) {
                    $muestra = Muestra::findOrFail($item['muestra_id']);
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
                    $inv = Inventario::with('estanteria')->findOrFail($item['inventario_id']);

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

            DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));

            return response()->json([
                'message' => 'Productos agregados correctamente.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function updateDetail(Request $request, Venta $venta, VentaDetalle $detalle)
    {
        $request->validate(['precio_unitario' => 'required|numeric|min:0']);

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden modificar precios en facturas abiertas.'], 422);
        }

        try {
            DB::beginTransaction();

            $oldSubtotal = $detalle->subtotal;
            $newSubtotal = $detalle->cantidad * $request->precio_unitario;

            $detalle->update([
                'precio_unitario' => $request->precio_unitario,
                'subtotal' => $newSubtotal,
            ]);

            $venta->decrement('total', $oldSubtotal);
            $venta->increment('total', $newSubtotal);

            DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));

            return response()->json([
                'message' => 'Precio actualizado correctamente.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function bulkDeleteDetails(Request $request, Venta $venta)
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
            DB::beginTransaction();

            foreach ($request->ids as $id) {
                $detalle = VentaDetalle::find($id);
                if (!$detalle || $detalle->venta_id !== $venta->id)
                    continue;
                $this->processDetailDeletion($venta, $detalle, $request->observacion);
            }

            DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));
            return response()->json([
                'message' => 'Productos eliminados y stock restaurado.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function deleteDetail(Request $request, Venta $venta, VentaDetalle $detalle)
    {
        $request->validate(['observacion' => 'required|string']);

        if ($venta->estado !== 'abierta') {
            return response()->json(['error' => 'Solo se pueden eliminar productos de facturas abiertas.'], 422);
        }

        try {
            DB::beginTransaction();
            $this->processDetailDeletion($venta, $detalle, $request->observacion);
            DB::commit();

            $resource = new VentaResource($venta->fresh(['detalles.producto', 'detalles.estanteria.bodega']));

            return response()->json([
                'message' => 'Producto eliminado y stock restaurado.',
                'data' => $resource->toArray($request)['detalles']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    private function processDetailDeletion(Venta $venta, VentaDetalle $detalle, string $observacion = '')
    {
        if ($detalle->muestra_id) {
            $muestra = Muestra::find($detalle->muestra_id);
            if ($muestra) {
                $muestra->update(['estado' => 'activo']);
            }
        } else {
            $inv = Inventario::find($detalle->inventario_id);
            if (!$inv) {
                $inv = Inventario::where([
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

    public function closeVenta(Venta $venta)
    {
        if (!auth()->user()->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
            return response()->json(['error' => 'No tiene permisos para cerrar facturas.'], 403);
        }

        // Allow closing empty invoices as per user request

        $venta->update(['estado' => 'cerrada']);
        return response()->json(['message' => 'Factura cerrada correctamente.', 'data' => $venta]);
    }

    public function updateBulkDiscounts(Request $request, Venta $venta)
    {
        $request->validate([
            'discounts' => 'required|array',
            'discounts.*' => 'required|numeric|min:0',
        ]);

        foreach ($request->discounts as $producto_id => $discount_value) {
            $detalles = VentaDetalle::with('inventario')
                ->where('venta_id', $venta->id)
                ->where('producto_id', $producto_id)
                ->get();

            foreach ($detalles as $detalle) {
                /** @var VentaDetalle $detalle */
                $base_price = $detalle->inventario->precio_venta ?? 0;
                $new_precio_unitario = max(0, $base_price - $discount_value);

                $detalle->update([
                    'precio_unitario' => $new_precio_unitario,
                    'subtotal' => $new_precio_unitario * $detalle->cantidad,
                ]);
            }
        }

        $total = VentaDetalle::where('venta_id', $venta->id)->sum('subtotal');
        $venta->update(['total' => $total]);

        $detalles = VentaDetalle::where('venta_id', $venta->id)
            ->with(['producto', 'bodega', 'estanteria', 'muestra'])
            ->get();

        return response()->json([
            'message' => 'Descuentos aplicados correctamente',
            'data' => $detalles
        ]);
    }

    public function destroy(Venta $venta)
    {
        $venta->delete();
        return response()->json(['message' => 'Venta eliminada correctamente']);
    }

    public function markPrinted(Request $request, Venta $venta)
    {
        $request->validate([
            'detalle_ids' => 'required|array',
            'detalle_ids.*' => 'integer|exists:venta_detalles,id',
        ]);

        VentaDetalle::where('venta_id', $venta->id)
            ->whereIn('id', $request->detalle_ids)
            ->update(['impreso' => true]);

        return response()->json(['message' => 'Items marcados como impresos.']);
    }

    public function getDetails(Request $request, Venta $venta)
    {
        $query = $venta->detalles()->with(['producto', 'estanteria.bodega', 'cambio.creator']);

        $perPage = $request->input('per_page', 10);
        $paginated = $query->paginate($perPage);

        return VentaDetalleResource::collection($paginated);
    }

    public function getLocalesWithInvoices(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';
        $cuenta_id = $isSuper ? $request->cuenta_id : $user->cuenta_id;

        if (!$cuenta_id) {
            return response()->json(['data' => []]);
        }

        $locals = \App\Models\User::role('local')
            ->whereHas('ventas', function ($q) use ($cuenta_id) {
                $q->where('cuenta_id', $cuenta_id);
            })
            ->orderBy('name', 'asc')
            ->get(['id', 'name']);

        return response()->json(['data' => $locals]);
    }

    public function getReturns(Request $request, Venta $venta)
    {
        $returns = \App\Models\Devolucion::where('venta_id', $venta->id)
            ->with(['producto', 'estanteria.bodega'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json(['data' => $returns]);
    }
}
