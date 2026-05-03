<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompraResource;
use App\Models\Compra;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ComprasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $sortField = $request->input('sort_field', 'fecha_apertura');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Compra::with(['cuenta', 'proveedor', 'detalles.producto']);

        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('proveedor', function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%");
            });
        }

        return CompraResource::collection(
            $query->orderBy($sortField, $sortOrder)
                  ->paginate($request->input('per_page', 25))
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'proveedor_id'   => 'required|exists:proveedores,id',
            'estado'         => ['required', Rule::in(['abierta', 'cerrada'])],
            'fecha_apertura' => 'required|date',
            'fecha_cierre'   => 'nullable|date|after_or_equal:fecha_apertura',
            'observaciones'  => 'nullable|string',
            'flete'          => 'nullable|numeric|min:0',
            'cuenta_id'      => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            $validated['cuenta_id'] = auth()->user()->cuenta_id;
        }

        $compra = Compra::create($validated);
        $compra->load('cuenta', 'proveedor', 'detalles.producto');

        return new CompraResource($compra);
    }

    /**
     * Display the specified resource.
     */
    public function show(Compra $compra)
    {
        $compra->load('cuenta', 'proveedor', 'detalles.producto');
        return new CompraResource($compra);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Compra $compra)
    {
        $validated = $request->validate([
            'proveedor_id'   => 'required|exists:proveedores,id',
            'estado'         => ['required', Rule::in(['abierta', 'cerrada'])],
            'fecha_apertura' => 'required|date',
            'fecha_cierre'   => 'nullable|date|after_or_equal:fecha_apertura',
            'observaciones'  => 'nullable|string',
            'flete'          => 'nullable|numeric|min:0',
            'cuenta_id'      => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            unset($validated['cuenta_id']);
        }

        $compra->update($validated);
        $compra->load('cuenta', 'proveedor', 'detalles.producto');

        return new CompraResource($compra);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Compra $compra)
    {
        $compra->delete();
        return response()->json(['message' => 'Compra eliminada correctamente']);
    }
}
