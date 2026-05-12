<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Http\Resources\VentaResource;
use Illuminate\Http\Request;

class FacturasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $sortField = $request->input('sort_field', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Venta::with(['local', 'cuenta', 'creator', 'vendedor', 'detalles:id,venta_id,bodega_id', 'detalles.bodega:id,nombre']);

        if ($user->hasRole('local')) {
            $query->where('user_id', $user->id);
        } elseif (!$isSuper) {
            $query->whereIn('cuenta_id', $user->getAccessibleAccountIds());
        }

        // Apply tab filters
        $tab = $request->input('tab', 'todas');
        if ($tab === 'abiertas') {
            $query->where('estado', 'abierta');
        } elseif ($tab === 'cerradas') {
            $query->where('estado', 'cerrada');
        } elseif ($tab === 'pendientes') {
            $query->where('estado', 'pendiente');
        } elseif ($tab === 'sin_precio') {
            $query->where('total', 0);
        }

        // Apply search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('numero', 'like', '%' . $request->search . '%')
                    ->orWhereHas('local', function ($lq) use ($request) {
                        $lq->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }

        // Apply date filters
        if ($request->filled('desde')) {
            $query->whereDate('fecha', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('fecha', '<=', $request->hasta);
        }

        $granTotal = (float) $query->sum('total');
        $granTotalItems = (int) \App\Models\VentaDetalle::whereIn('venta_id', (clone $query)->select('id'))->sum('cantidad');
        
        $paginated = $query->withSum('detalles as total_items', 'cantidad')
            ->orderBy($sortField, $sortOrder)
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $paginated->getCollection()->map(fn($v) => [
                'id' => $v->id,
                'numero' => $v->numero,
                'fecha' => $v->fecha ? $v->fecha->format('Y-m-d') : null,
                'diferencia_dias' => $v->fecha ? (int) $v->fecha->diffInDays(now()) : 0,
                'created_at' => $v->created_at->toISOString(),
                'estado' => $v->estado,
                'total' => (float) $v->total,
                'items_count' => (int) ($v->total_items ?? 0),
                'local' => [
                    'id' => $v->local->id ?? null,
                    'name' => $v->local->name ?? 'N/A',
                ],
                'bodega' => [
                    'id' => $v->detalles->first()?->bodega->id ?? null,
                    'nombre' => $v->detalles->first()?->bodega->nombre ?? 'N/A',
                ],
                'cuenta' => $v->cuenta->nombre ?? 'N/A',
                'vendedor' => $v->vendedor ? $v->vendedor->nombre : ($v->creator ? $v->creator->name : ($v->local->name ?? 'N/A')),
            ]),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'gran_total' => $granTotal,
                'gran_total_items' => $granTotalItems,
            ]
        ]);
    }
}
