<?php

namespace App\Http\Controllers;

use App\Http\Resources\InventarioResource;
use App\Models\Inventario;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventariosController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventario::with(['referencia', 'estanteria.bodega'])->orderBy('id', 'desc');

        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referencia', function ($rq) use ($search) {
                    $rq->where('codigo', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%")
                        ->orWhere('marca', 'like', "%{$search}%");
                })->orWhere('talla', 'like', "%{$search}%");
            });
        }

        return Inertia::render('inventario/Index', [
            'filters' => $request->only(['search', 'per_page']),
            'lista' => InventarioResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
        ]);
    }
}
