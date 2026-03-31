<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CuentasResource;
use App\Models\Cuenta;
use Illuminate\Http\Request;

class CuentasController extends Controller
{
    public function show(Cuenta $cuenta)
    {
        return response()->json(['data' => new CuentasResource($cuenta)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'estado' => 'required|boolean',
        ]);

        $cuenta = Cuenta::create($validated);

        return response()->json(['data' => new CuentasResource($cuenta)], 201);
    }

    public function update(Request $request, Cuenta $cuenta)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'estado' => 'required|boolean',
        ]);

        $cuenta->update($validated);

        return response()->json(['data' => new CuentasResource($cuenta)]);
    }

    public function destroy(Cuenta $cuenta)
    {
        $cuenta->delete();

        return response()->json(['message' => 'Cuenta eliminada correctamente']);
    }
}
