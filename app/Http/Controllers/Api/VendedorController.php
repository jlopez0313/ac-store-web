<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendedor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VendedorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Vendedor::query();

        // Si se solicita un local específico
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Restricción por cuenta
        if ($user->hasRole('superadmin')) {
            if ($request->has('cuenta_id')) {
                $query->where('cuenta_id', $request->cuenta_id);
            }
        } else {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('documento', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->with(['cuenta', 'user'])->orderBy('nombre')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'nombre' => 'required|string|max:255',
            'documento' => 'nullable|string|max:20',
            'user_id' => 'required|exists:users,id',
            'cuenta_id' => 'nullable|exists:cuentas,id',
        ]);

        $targetUser = User::findOrFail($request->user_id);
        
        // Determinar la cuenta: 
        // 1. Si se envía en el request (solo superadmin debería poder enviarlo libremente, pero validamos para todos)
        // 2. Si no, usar la del usuario destino (local)
        // 3. Si no, usar la del usuario autenticado (si no es superadmin)
        $cuentaId = $request->cuenta_id;
        
        if (!$cuentaId) {
            $cuentaId = $targetUser->cuenta_id ?? ($user->hasRole('superadmin') ? null : $user->cuenta_id);
        }

        if (!$cuentaId) {
            return response()->json([
                'message' => 'El local seleccionado no tiene una cuenta asociada. Por favor, asigne una cuenta al usuario primero o seleccione una cuenta manualmente.',
                'errors' => ['cuenta_id' => ['El campo cuenta id es obligatorio.']]
            ], 422);
        }

        $vendedor = Vendedor::create([
            'nombre'    => $request->nombre,
            'documento' => $request->documento,
            'user_id'   => $request->user_id,
            'cuenta_id' => $cuentaId,
            'estado'    => true,
        ]);

        return response()->json(['data' => $vendedor], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vendedor $vendedor)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'documento' => 'nullable|string|max:20',
            'estado' => 'boolean',
        ]);

        $vendedor->update($request->only(['nombre', 'documento', 'estado']));

        return response()->json(['data' => $vendedor]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vendedor $vendedor)
    {
        $vendedor->delete();
        return response()->json(null, 204);
    }
}
