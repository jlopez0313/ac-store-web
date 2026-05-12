<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CuentasResource;
use App\Models\Cuenta;
use Illuminate\Http\Request;

class CuentasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sortField = $request->input('sort_field', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Cuenta::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('nombre', 'like', "%{$search}%");
        }

        $paginated = $query->orderBy($sortField, $sortOrder)
            ->paginate($request->input('per_page', 25));

        return CuentasResource::collection($paginated);
    }

    public function show(Cuenta $cuenta)
    {
        return response()->json(['data' => new CuentasResource($cuenta)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'estado' => 'required|boolean',
            'precio_suscripcion' => 'nullable|numeric',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $cuenta = Cuenta::create(array_merge($validated, [
            'precio_suscripcion' => $validated['precio_suscripcion'] ?? config('constants.suscripciones.default_account_price')
        ]));

        return response()->json([
            'data' => new CuentasResource($cuenta),
            'db_credentials' => $cuenta->getDbViewCredentials()
        ], 201);
    }

    public function update(Request $request, Cuenta $cuenta)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'estado' => 'required|boolean',
            'precio_suscripcion' => 'nullable|numeric',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $cuenta->update($validated);

        return response()->json(['data' => new CuentasResource($cuenta)]);
    }

    public function destroy(Cuenta $cuenta)
    {
        $cuenta->delete();

        return response()->json(['message' => 'Cuenta eliminada correctamente']);
    }

    public function getList()
    {
        if (!auth()->user()->hasRole('superadmin')) {
            abort(403);
        }

        return response()->json(
            Cuenta::where('estado', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre as name'])
        );
    }
}
