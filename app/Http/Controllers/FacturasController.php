<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Http\Resources\VentaResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacturasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Venta::with(['local', 'creator', 'detalles.bodega', 'detalles.cambio'])
            ->orderBy('id', 'desc');

        if (!$isSuper) {
            $query->whereIn('cuenta_id', $user->getAccessibleAccountIds());
        }

        // Apply tab filters
        $tab = $request->query('tab', 'todas');
        if ($tab === 'abiertas') {
            $query->where('estado', 'abierta');
        } elseif ($tab === 'cerradas') {
            $query->where('estado', 'cerrada');
        } elseif ($tab === 'pendientes') {
            // Placeholder: for now assume 'pendiente' status or logic
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
        $perPage = $request->input('per_page', 25);
        $paginated = $query->paginate($perPage)->appends(request()->all());

        return Inertia::render('facturas/Index', [
            'lista' => VentaResource::collection($paginated),
            'filters' => request()->all(['search', 'tab', 'per_page']),
            'gran_total' => $granTotal,
        ]);
    }
}
