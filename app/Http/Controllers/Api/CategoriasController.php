<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\Request;

class CategoriasController extends Controller
{
    public function index(Request $request)
    {
        $sortField = $request->input('sort_field', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');

        $query = Categoria::query();

        if ($request->filled('search')) {
            $query->where('nombre', 'like', "%{$request->search}%");
        }

        $query->orderBy($sortField, $sortOrder);

        return CategoriaResource::collection(
            $query->paginate($request->input('per_page', 25))
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre'            => 'required|string|max:255',
            'tipo_control'      => 'required|in:tallas,unidades',
            'prefijo_sku'       => 'required|string|size:3|unique:categorias,prefijo_sku',
            'subdivision_stock' => 'nullable|array',
            'variaciones_json'  => 'nullable|array',
        ]);

        $categoria = Categoria::create($validated);

        return new CategoriaResource($categoria);
    }

    /**
     * Display the specified resource.
     */
    public function show(Categoria $categoria)
    {
        return new CategoriaResource($categoria);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre'            => 'required|string|max:255',
            'tipo_control'      => 'required|in:tallas,unidades',
            'prefijo_sku'       => 'required|string|size:3|unique:categorias,prefijo_sku,' . $categoria->id,
            'subdivision_stock' => 'nullable|array',
            'variaciones_json'  => 'nullable|array',
        ]);

        $categoria->update($validated);

        return new CategoriaResource($categoria);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Categoria $categoria)
    {
        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada correctamente']);
    }
}
