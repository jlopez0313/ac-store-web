<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReferenciaResource;
use App\Models\Categoria;
use App\Models\Cuenta;
use App\Models\Referencia;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferenciasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Referencia::with(['categoria', 'cuenta'])->orderBy('codigo');

        // Tenancy filtering if not superadmin
        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        // General search
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('codigo', 'like', '%' . $request->search . '%')
                  ->orWhere('marca', 'like', '%' . $request->search . '%')
                  ->orWhere('descripcion', 'like', '%' . $request->search . '%');
            });
        }

        // Sorting logic
        if ($request->filled('sort')) {
            // Check if column is sortable to prevent SQL injection or errors
            $sortableColumns = ['id', 'codigo', 'marca', 'created_at'];
            if (in_array($request->sort, $sortableColumns)) {
                 $query->orderBy($request->sort, $request->input('order', 'asc'));
            }
        }

        return Inertia::render('referencias/Index', [
            'filters'    => $request->only(['search', 'sort', 'order']),
            'lista'      => ReferenciaResource::collection(
                $query->paginate($request->input('per_page', 10))->appends($request->all())
            ),
            'cuentas'    => auth()->user()->hasRole('superadmin') ? Cuenta::select('id', 'nombre')->get() : [],
            'categorias' => Categoria::select('id', 'nombre')->orderBy('nombre')->get(),
        ]);
    }
}
