<?php

namespace App\Http\Controllers;

use App\Http\Resources\CompraResource;
use App\Models\Compra;
use App\Models\Cuenta;
use App\Models\Proveedor;
use App\Models\Bodega;
use App\Models\Referencia;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComprasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Compra::with(['cuenta', 'proveedor', 'detalles.producto'])->orderBy('id', 'desc');

        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        if ($request->filled('search')) {
            // General basic search 
            $query->where(function ($q) use ($request) {
                // e.g., Filter by provider's name or observation contents
                $q->whereHas('proveedor', function($pq) use ($request) {
                    $pq->where('nombre', 'like', '%' . $request->search . '%');
                })->orWhere('numero', 'like', '%' . $request->search . '%');
            });
        }

        // Calculate next ID for the UI
        $next_id = Compra::max('id') + 1;

        return Inertia::render('compras/Index', [
            'filters'     => $request->only(['search']),
            'lista'       => CompraResource::collection(
                $query->paginate($request->input('per_page', 20))->appends($request->all())
            ),
            'cuentas'     => auth()->user()->hasRole('superadmin') ? Cuenta::select('id', 'nombre')->get() : [],
            'proveedores' => Proveedor::select('id', 'nombre')->orderBy('nombre')->get(),
            'bodegas'     => auth()->user()->hasRole('superadmin') 
                ? Bodega::with('estanterias:id,bodega_id,nombre')->select('id', 'nombre')->get() 
                : Bodega::with('estanterias:id,bodega_id,nombre')->where('cuenta_id', auth()->user()->cuenta_id)->select('id', 'nombre')->get(),
            'referencias' => auth()->user()->hasRole('superadmin') 
                ? Referencia::with('categoria:id,nombre,variaciones_json')->get() 
                : Referencia::with('categoria:id,nombre,variaciones_json')->where('cuenta_id', auth()->user()->cuenta_id)->get(),
            'next_id'     => $next_id,
        ]);
    }
}
