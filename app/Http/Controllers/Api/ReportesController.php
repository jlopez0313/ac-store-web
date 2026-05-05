<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;

class ReportesController extends Controller
{
    public function ventas(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = VentaDetalle::with([
            'venta.local',
            'venta.cuenta',
            'producto.marca',
            'estanteria.bodega',
        ])
        ->whereHas('venta', function ($q) use ($user, $isSuper, $request) {
            if (!$isSuper) {
                $q->where('cuenta_id', $user->cuenta_id);
            } elseif ($request->filled('cuenta_id') && $request->cuenta_id !== 'all') {
                $q->where('cuenta_id', $request->cuenta_id);
            }

            if ($request->filled('local_id')) {
                $q->where('user_id', $request->local_id);
            }

            if ($request->filled('desde')) {
                $q->whereDate('fecha', '>=', $request->desde);
            }
            if ($request->filled('hasta')) {
                $q->whereDate('fecha', '<=', $request->hasta);
            }
        })
        ->where('precio_unitario', '>', 0) // Exclude credit/adjustment lines
        ->orderByDesc('id');

        // Totals before pagination
        $totalVentas   = (clone $query)->sum('subtotal');
        $totalProductos = (clone $query)->sum('cantidad');

        $paginated = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $paginated->getCollection()->map(fn($d) => [
                'id'             => $d->id,
                'factura_id'     => $d->venta_id,
                'factura_numero' => $d->venta->numero ?? '-',
                'fecha'          => $d->venta->fecha?->format('Y-m-d') ?? '-',
                'local'          => $d->venta->local->name ?? 'N/A',
                'cuenta'         => $d->venta->cuenta->nombre ?? 'N/A',
                'codigo'         => $d->producto->codigo ?? 'N/A',
                'descripcion'    => $d->producto->descripcion ?? 'N/A',
                'marca'          => $d->producto->marca->nombre ?? 'N/A',
                'talla'          => $d->talla,
                'bodega'         => $d->estanteria->bodega->nombre ?? 'N/A',
                'cantidad'       => $d->cantidad,
                'precio_unitario'=> $d->precio_unitario,
                'subtotal'       => $d->subtotal,
            ]),
            'meta' => [
                'current_page'    => $paginated->currentPage(),
                'per_page'        => $paginated->perPage(),
                'total'           => $paginated->total(),
                'total_ventas'    => (float) $totalVentas,
                'total_productos' => (int) $totalProductos,
            ],
        ]);
    }
}
