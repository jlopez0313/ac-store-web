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

        $query = Venta::with(['local', 'creator', 'detalles.bodega', 'detalles.cambio']);

        if (!$isSuper) {
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
                $q->where('id', 'like', '%' . $request->search . '%')
                    ->orWhereHas('local', function ($lq) use ($request) {
                        $lq->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }

        $granTotal = $query->sum('total');
        $paginated = $query->orderBy('id', 'desc')->paginate($request->input('per_page', 25));

        return VentaResource::collection($paginated)->additional([
            'meta' => [
                'gran_total' => $granTotal
            ]
        ]);
    }
}
