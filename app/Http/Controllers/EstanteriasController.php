<?php

namespace App\Http\Controllers;

use App\Models\Bodega;
use App\Models\Estanteria;
use Illuminate\Http\Request;

class EstanteriasController extends Controller
{
    public function index(Bodega $bodega)
    {
        return response()->json([
            'data' => $bodega->estanterias()->orderBy('nombre')->get()
        ]);
    }

    public function store(Request $request, Bodega $bodega)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
        ]);

        $estanteria = $bodega->estanterias()->create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => 1,
        ]);

        return response()->json([
            'message' => 'Estantería creada correctamente.',
            'data' => $estanteria
        ]);
    }

    public function update(Request $request, Bodega $bodega, Estanteria $estanteria)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'estado' => 'required|boolean',
        ]);

        $estanteria->update($request->only(['nombre', 'descripcion', 'estado']));

        return response()->json([
            'message' => 'Estantería actualizada correctamente.',
            'data' => $estanteria
        ]);
    }

    public function destroy(Bodega $bodega, Estanteria $estanteria)
    {
        // Optional: Check if there's stock in this shelf before deleting
        if ($estanteria->inventarios()->where('stock', '>', 0)->exists()) {
            return response()->json([
                'error' => 'No se puede eliminar una estantería que tiene stock disponible.'
            ], 422);
        }

        $estanteria->delete();

        return response()->json([
            'message' => 'Estantería eliminada correctamente.'
        ]);
    }
}
