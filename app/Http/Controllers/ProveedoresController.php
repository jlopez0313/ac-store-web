<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProveedorResource;
use App\Models\Cuenta;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProveedoresController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Proveedor::with('cuenta')->orderBy('nombre');

        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'like', '%' . $request->search . '%')
                  ->orWhere('documento', 'like', '%' . $request->search . '%')
                  ->orWhere('correo', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('sort')) {
            $sortableColumns = ['id', 'nombre', 'documento', 'created_at'];
            if (in_array($request->sort, $sortableColumns)) {
                 $query->orderBy($request->sort, $request->input('order', 'asc'));
            }
        }

        // Format document types for frontend selection
        $tiposDocs = config('constants.tipos_documento', []);
        $formattedTiposDocs = [];
        foreach ($tiposDocs as $key => $val) {
            $formattedTiposDocs[] = ['id' => $key, 'nombre' => $val];
        }

        return Inertia::render('proveedores/Index', [
            'filters'         => $request->only(['search', 'sort', 'order']),
            'lista'           => ProveedorResource::collection(
                $query->paginate($request->input('per_page', 10))->appends($request->all())
            ),
            'cuentas'         => auth()->user()->hasRole('superadmin') ? Cuenta::select('id', 'nombre')->get() : [],
            'tipos_documento' => $formattedTiposDocs,
        ]);
    }
}
