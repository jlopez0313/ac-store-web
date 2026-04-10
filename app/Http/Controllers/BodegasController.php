<?php

namespace App\Http\Controllers;

use App\Http\Resources\BodegaResource;
use App\Models\Bodega;
use App\Models\Cuenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Request as Peticion;
use Inertia\Inertia;

class BodegasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Bodega::with('cuenta')->orderBy('nombre');

        // Multi-tenant check: if not superadmin, only show bodegas of their account
        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . $request->search . '%')
                  ->orWhere('direccion', 'like', '%' . $request->search . '%');
        }

        return Inertia::render('bodegas/Index', [
            'filters'  => Peticion::only(['search', 'per_page']),
            'estados'  => config('constantes.estados'),
            'cuentas'  => $user->hasRole('superadmin') ? Cuenta::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre as name']) : [],
            'lista'    => BodegaResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
        ]);
    }
}
