<?php

namespace App\Http\Controllers;

use App\Http\Resources\DevolucionResource;
use App\Models\Devolucion;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DevolucionesController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = \App\Models\VentaDetalle::onlyTrashed()
            ->whereHas('venta', function ($q) use ($user) {
                if (!$user->hasRole('superadmin')) {
                    $q->where('cuenta_id', $user->cuenta_id);
                }
            })
            ->with(['venta.local', 'producto', 'bodega', 'estanteria', 'eliminador'])
            ->orderBy('deleted_at', 'desc');

        if ($request->filled('local_id')) {
            $query->whereHas('venta', function ($q) use ($request) {
                $q->where('user_id', $request->local_id);
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('deleted_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('deleted_at', '<=', $request->to);
        }

        $devoluciones = $query->paginate($request->input('per_page', 25))->appends($request->all());

        $localsQuery = \App\Models\User::role('local');
        if (!$user->hasRole('superadmin')) {
            $localsQuery->where('cuenta_id', $user->cuenta_id);
        }
        $locals = $localsQuery->get(['id', 'name']);

        return Inertia::render('devoluciones/Index', [
            'devoluciones' => DevolucionResource::collection($devoluciones),
            'locals' => $locals,
            'filters' => $request->only(['local_id', 'from', 'to', 'per_page'])
        ]);
    }
}
