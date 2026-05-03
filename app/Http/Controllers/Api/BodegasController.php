<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BodegaResource;
use App\Models\Bodega;
use Illuminate\Http\Request;

class BodegasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $sortField = $request->input('sort_field', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');

        $query = Bodega::with('cuenta');

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', "%{$request->search}%");
        }

        $query->orderBy($sortField, $sortOrder);

        return BodegaResource::collection(
            $query->paginate($request->input('per_page', 25))
        );
    }

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

    public function destroy(Bodega $bodega)
    {
        $bodega->delete();
        return response()->json(['message' => 'Bodega eliminada correctamente']);
    }

    public function getAccesos(Request $request, Bodega $bodega)
    {
        $user = auth()->user();
        $query = \App\Models\User::role('local');

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $accesos = $query->get()->map(function ($local) use ($bodega) {
            $acceso = \App\Models\BodegaAcceso::where('bodega_id', $bodega->id)
                ->where('user_id', $local->id)
                ->first();

            return [
                'id' => $local->id,
                'nombre' => $local->name,
                'username' => $local->username,
                'email' => $local->email,
                'can_view' => $acceso ? (bool)$acceso->can_view : false,
                'can_order' => $acceso ? (bool)$acceso->can_order : false,
                'descuento' => $acceso ? $acceso->descuento : 0,
            ];
        });

        return response()->json(['data' => $accesos]);
    }

    public function getList(Request $request)
    {
        $user = auth()->user();
        $query = Bodega::where('estado', true)->orderBy('nombre');

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        return response()->json($query->get(['id', 'nombre as name']));
    }
}
