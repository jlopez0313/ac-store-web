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

        $query = \App\Models\Venta::select('ventas.*')
            ->with(['local', 'cuenta'])
            ->withSum('detalles as total_cantidad', 'cantidad')
            ->withSum('detalles as total_valor', 'subtotal')
            ->withExists('devoluciones as has_returns');

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

        $sortBy = $request->input('sort_by', 'id');
        $sortDir = $request->input('sort_dir', 'desc');

        // Map frontend field names to database columns
        $sortMap = [
            'factura_numero' => 'numero',
            'fecha' => 'fecha',
            'local' => 'users.name',
            'items_count' => 'total_cantidad',
            'total' => 'total_valor',
            'id' => 'ventas.id'
        ];

        if ($sortBy === 'local') {
            $query->leftJoin('users', 'ventas.user_id', '=', 'users.id');
        }

        $column = $sortMap[$sortBy] ?? 'ventas.id';
        $query->orderBy($column, $sortDir);

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
                'has_returns'    => (bool) $v->has_returns,
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
