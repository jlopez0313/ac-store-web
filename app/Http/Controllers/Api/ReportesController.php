<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportesController extends Controller
{
    public function ventas(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Venta::with(['local', 'cuenta', 'vendedor']);

        // Filter by Account
        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id') && $request->cuenta_id !== 'all') {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        // Filter by Local
        if ($request->filled('local_id')) {
            $query->where('user_id', $request->local_id);
        }

        // Filter by Date Range
        if ($request->filled('desde')) {
            $query->whereDate('fecha', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('fecha', '<=', $request->hasta);
        }

        // Order
        $query->orderBy('fecha', 'desc')->orderBy('id', 'desc');

        // Totals before pagination
        $totalsQuery = clone $query;
        $totalVentas = (clone $query)->sum('total');
        $ventaIds = (clone $query)->pluck('id');
        $totalProductos = VentaDetalle::whereIn('venta_id', $ventaIds)->sum('cantidad');

        $paginated = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'total_ventas' => (float) $totalVentas,
                'total_productos' => (int) $totalProductos,
            ]
        ]);
    }
}
