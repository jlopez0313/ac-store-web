<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referencia;
use Illuminate\Http\Request;

class CardexController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';
        $cuentaId = $user->cuenta_id;

        // Base Query
        $query = Referencia::with(['categoria', 'marca'])
            ->withSum(['inventarios as bodega' => function ($q) use ($isSuper, $cuentaId) {
                if (!$isSuper) $q->where('cuenta_id', $cuentaId);
            }], 'stock')
            ->withSum(['ventaDetalles as ventas' => function ($q) use ($isSuper, $cuentaId) {
                if (!$isSuper) $q->where('cuenta_id', $cuentaId);
                $q->whereHas('venta', fn($v) => $v->where('estado', 'cerrada'));
            }], 'cantidad')
            ->with(['inventarios' => function ($q) use ($isSuper, $cuentaId) {
                 if (!$isSuper) $q->where('cuenta_id', $cuentaId);
            }]);

        if (!$isSuper) {
            $query->where('cuenta_id', $cuentaId);
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('codigo', 'like', '%' . $request->search . '%')
                    ->orWhere('descripcion', 'like', '%' . $request->search . '%')
                    ->orWhereHas('marca', function ($mq) use ($request) {
                        $mq->where('nombre', 'like', '%' . $request->search . '%');
                    });
            });
        }

        // Filtering by Tab
        $tab = strtolower($request->input('tab', 'todo'));
        switch ($tab) {
            case 'más tiempo en bodega':
                $query->orderBy('created_at', 'asc');
                break;
            case 'menos tiempo en bodega':
                $query->orderBy('created_at', 'desc');
                break;
            case 'más cantidad en bodega':
                $query->orderBy('bodega', 'desc');
                break;
            case 'menos cantidad en bodega':
                $query->orderBy('bodega', 'asc');
                break;
            case 'agotado':
                $query->having('bodega', '<=', 0);
                break;
            default:
                $query->orderBy('codigo', 'asc')->orderBy('id', 'asc');
                break;
        }

        $paginated = $query->paginate($request->input('per_page', 25));

        $items = collect($paginated->items())->map(function ($r) {
            $bodega = (int) ($r->bodega ?? 0);
            $ventas = (int) ($r->ventas ?? 0);
            $p_costo = $r->inventarios->avg('precio_compra') ?? 0;
            $p_venta = $r->inventarios->max('precio_venta') ?? 0;

            return [
                'id' => $r->id,
                'referencia' => $r->codigo,
                'descripcion' => $r->descripcion,
                'entradas' => $bodega + $ventas,
                'ventas' => $ventas,
                'bodega' => $bodega,
                'dias' => $r->created_at ? (int) $r->created_at->diffInDays(now()) : 0,
                'p_costo' => (int) $p_costo,
                'p_venta' => (int) $p_venta,
            ];
        });

        // Global Stats
        $statsQuery = Referencia::query();
        if (!$isSuper) $statsQuery->where('cuenta_id', $cuentaId);

        $statsData = $statsQuery->withSum(['inventarios as bodega' => function ($q) use ($isSuper, $cuentaId) {
                if (!$isSuper) $q->where('cuenta_id', $cuentaId);
            }], 'stock')
            ->withSum(['ventaDetalles as ventas' => function ($q) use ($isSuper, $cuentaId) {
                if (!$isSuper) $q->where('cuenta_id', $cuentaId);
                $q->whereHas('venta', fn($v) => $v->where('estado', 'cerrada'));
            }], 'cantidad')
            ->get();

        $totalBodega = $statsData->sum('bodega');
        $totalVentas = $statsData->sum('ventas');

        return response()->json([
            'data' => $items,
            'meta' => [
                'total' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'stats' => [
                    'total_referencias' => $statsData->count(),
                    'total_bodega' => (int) $totalBodega,
                    'total_ventas' => (int) $totalVentas,
                    'total_entradas' => (int) ($totalBodega + $totalVentas),
                ]
            ],
        ]);
    }
}
