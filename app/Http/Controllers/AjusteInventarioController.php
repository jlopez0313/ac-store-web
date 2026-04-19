<?php

namespace App\Http\Controllers;

use App\Models\AjusteInventario;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AjusteInventarioController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = AjusteInventario::with(['referencia', 'estanteria.bodega', 'creador'])
            ->orderBy('created_at', 'desc');

        // Tenancy filtering
        if (!$isSuper) {
            $query->whereHas('referencia', function ($q) use ($user) {
                $q->where('cuenta_id', $user->cuenta_id);
            });
        }

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('referencia', function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $ajustes = $query->paginate($request->input('per_page', 25))->appends($request->all());

        return Inertia::render('inventario/AjustesReport', [
            'ajustes' => $ajustes,
            'filters' => $request->only(['search', 'from', 'to', 'per_page'])
        ]);
    }
}

