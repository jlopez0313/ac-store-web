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

        $query = \App\Models\Venta::with(['local', 'cuenta'])
            ->withSum('detalles as total_cantidad', 'cantidad')
            ->withSum('detalles as total_valor', 'subtotal');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id') && $request->cuenta_id !== 'all') {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('local_id')) {
            $query->where('user_id', $request->local_id);
        }

        if ($request->filled('desde')) {
            $query->whereDate('fecha', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('fecha', '<=', $request->hasta);
        }

        $query->whereHas('detalles'); // Only invoices with items
        $query->orderByDesc('id');

        // Totals for KPIs (using VentaDetalle to get the same logic as before)
        $detailsQuery = \App\Models\VentaDetalle::whereHas('venta', function ($q) use ($user, $isSuper, $request) {
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
        });

        $totalVentas    = (clone $detailsQuery)->sum('subtotal');
        $totalProductos = (clone $detailsQuery)->sum('cantidad');
        $totalFacturas  = (clone $detailsQuery)->distinct()->count('venta_id');

        $paginated = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $paginated->getCollection()->map(fn($v) => [
                'id'             => $v->id,
                'factura_numero' => $v->numero ?? '-',
                'fecha'          => $v->fecha?->format('Y-m-d') ?? '-',
                'local'          => $v->local->name ?? 'N/A',
                'cuenta'         => $v->cuenta->nombre ?? 'N/A',
                'items_count'    => (int) $v->total_cantidad,
                'total'          => (float) $v->total_valor,
            ]),
            'meta' => [
                'current_page'    => $paginated->currentPage(),
                'per_page'        => $paginated->perPage(),
                'total'           => $paginated->total(),
                'total_facturas'  => $totalFacturas,
                'total_ventas'    => (float) $totalVentas,
                'total_productos' => (int) $totalProductos,
            ],
        ]);
    }
}
