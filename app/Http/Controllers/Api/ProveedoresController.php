<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProveedorResource;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

        return ProveedorResource::collection(
            $query->paginate($request->input('per_page', 10))->appends($request->all())
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $tiposPermitidos = array_keys(config('constants.tipos_documento', []));

        $validated = $request->validate([
            'nombre'         => 'required|string|max:255',
            'tipo_documento' => ['required', Rule::in($tiposPermitidos)],
            'documento'      => 'required|string|max:50',
            'telefono'       => 'nullable|string|max:20',
            'correo'         => 'nullable|email|max:255',
            'cuenta_id'      => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            $validated['cuenta_id'] = auth()->user()->cuenta_id;
        }

        // Validate unique document per account
        $request->validate([
            'documento' => Rule::unique('proveedores')->where(function ($query) use ($validated) {
                return $query->where('cuenta_id', $validated['cuenta_id']);
            })
        ]);

        $proveedor = Proveedor::create($validated);
        $proveedor->load('cuenta');

        return new ProveedorResource($proveedor);
    }

    /**
     * Display the specified resource.
     */
    public function show(Proveedor $proveedore)
    {
        // Parameter binding for singular is usually identical to model name (lowercase)
        $proveedore->load('cuenta');
        return new ProveedorResource($proveedore);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Proveedor $proveedore)
    {
        $tiposPermitidos = array_keys(config('constants.tipos_documento', []));

        $validated = $request->validate([
            'nombre'         => 'required|string|max:255',
            'tipo_documento' => ['required', Rule::in($tiposPermitidos)],
            'documento'      => 'required|string|max:50',
            'telefono'       => 'nullable|string|max:20',
            'correo'         => 'nullable|email|max:255',
            'cuenta_id'      => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            unset($validated['cuenta_id']);
            $checkCuentaId = auth()->user()->cuenta_id;
        } else {
            $checkCuentaId = $validated['cuenta_id'];
        }

        $request->validate([
            'documento' => Rule::unique('proveedores')->where(function ($query) use ($checkCuentaId) {
                return $query->where('cuenta_id', $checkCuentaId);
            })->ignore($proveedore->id)
        ]);

        $proveedore->update($validated);
        $proveedore->load('cuenta');

        return new ProveedorResource($proveedore);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Proveedor $proveedore)
    {
        $proveedore->delete();
        return response()->json(['message' => 'Proveedor eliminado correctamente']);
    }
}
