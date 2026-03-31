<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BodegaResource;
use App\Models\Bodega;
use Illuminate\Http\Request;

class BodegasController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre'    => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'estado'    => 'required|boolean',
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            $validated['cuenta_id'] = auth()->user()->cuenta_id;
        }

        $bodega = Bodega::create($validated);

        return new BodegaResource($bodega);
    }

    /**
     * Display the specified resource.
     */
    public function show(Bodega $bodega)
    {
        return new BodegaResource($bodega);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Bodega $bodega)
    {
        $validated = $request->validate([
            'nombre'    => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'estado'    => 'required|boolean',
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            unset($validated['cuenta_id']); // Don't allow changing account if not superadmin
        }

        $bodega->update($validated);

        return new BodegaResource($bodega);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bodega $bodega)
    {
        $bodega->delete();
        return response()->json(['message' => 'Bodega eliminada correctamente']);
    }
}
