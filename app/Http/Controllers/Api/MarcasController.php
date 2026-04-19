<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Marca;
use Illuminate\Http\Request;

class MarcasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $sortField = $request->input('sort_field', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');

        $query = Marca::with('cuenta');

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', "%{$request->search}%");
        }

        $query->orderBy($sortField, $sortOrder);

        return response()->json([
            'data' => $query->paginate($request->input('per_page', 25)),
            'meta' => [
                'total' => $query->count() // Wait, paginate already has it, but I'll return the whole paginator if I want consistency or just use resource.
            ]
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Marca $marca)
    {
        if (!auth()->user()->hasRole('superadmin') && $marca->cuenta_id !== auth()->user()->cuenta_id) {
            abort(403);
        }

        return response()->json(['data' => $marca]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255|unique:marcas,nombre',
        ]);

        $data = $request->all();
        if (!auth()->user()->hasRole('superadmin')) {
            $data['cuenta_id'] = auth()->user()->cuenta_id;
        }

        $marca = Marca::create($data);

        return response()->json([
            'message' => 'Marca creada correctamente.',
            'data' => $marca
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Marca $marca)
    {
        if (!auth()->user()->hasRole('superadmin') && $marca->cuenta_id !== auth()->user()->cuenta_id) {
            abort(403);
        }

        $request->validate([
            'nombre' => 'required|string|max:255|unique:marcas,nombre,' . $marca->id,
        ]);

        $marca->update($request->all());

        return response()->json([
            'message' => 'Marca actualizada correctamente.',
            'data' => $marca
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Marca $marca)
    {
        if (!auth()->user()->hasRole('superadmin') && $marca->cuenta_id !== auth()->user()->cuenta_id) {
            abort(403);
        }

        // Check if brand has references
        if ($marca->referencias()->count() > 0) {
            return response()->json([
                'error' => 'No se puede eliminar la marca porque tiene referencias asociadas.'
            ], 422);
        }

        $marca->delete();

        return response()->json(['message' => 'Marca eliminada correctamente.']);
    }
}
