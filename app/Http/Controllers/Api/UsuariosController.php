<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuariosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $sortField = $request->input('sort_field', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = User::with(['roles', 'cuenta', 'ciudad.state.country']);

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderBy($sortField, $sortOrder)
            ->paginate($request->input('per_page', 25));

        return UserResource::collection($paginated);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'documento' => 'nullable|string|max:50',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|exists:roles,name',
            'cuenta_id' => 'nullable|exists:cuentas,id',
            'estado' => 'required|boolean',
            'impresion_principal' => 'nullable|boolean',
            'nombre_impresora' => 'nullable|string|max:255',
            'ciudad_id' => 'nullable|exists:cities,id',
            'precio_suscripcion' => 'nullable|numeric',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'documento' => $validated['documento'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'cuenta_id' => $validated['cuenta_id'] ?? null,
            'estado' => $validated['estado'],
            'impresion_principal' => $validated['impresion_principal'] ?? false,
            'nombre_impresora' => $validated['nombre_impresora'] ?? null,
            'ciudad_id' => $request->ciudad_id ?? null,
            'fecha_vencimiento' => $validated['fecha_vencimiento'] ?? null,
            'email_verified_at' => now(),
        ]);

        $user->syncRoles($validated['role']);

        // Set subscription price if not manually provided
        if (empty($validated['precio_suscripcion'])) {
            $user->update(['precio_suscripcion' => $user->calculateSubscriptionPrice()]);
        } else {
            $user->update(['precio_suscripcion' => $validated['precio_suscripcion']]);
        }

        return new UserResource($user->fresh());
    }

    /**
     * Display the specified resource.
     */
    public function show(User $usuario)
    {
        return new UserResource($usuario->load(['roles', 'cuenta', 'ciudad.state.country']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $usuario)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($usuario->id)],
            'documento' => 'nullable|string|max:50',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($usuario->id)],
            'password' => 'nullable|string|min:6',
            'role' => 'required|exists:roles,name',
            'cuenta_id' => 'nullable|exists:cuentas,id',
            'estado' => 'required|boolean',
            'impresion_principal' => 'nullable|boolean',
            'nombre_impresora' => 'nullable|string|max:255',
            'ciudad_id' => 'nullable|exists:cities,id',
            'precio_suscripcion' => 'nullable|numeric',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $usuario->update([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'documento' => $validated['documento'],
            'email' => $validated['email'],
            'cuenta_id' => $request->has('cuenta_id') ? ($validated['cuenta_id'] ?? null) : $usuario->cuenta_id,
            'estado' => $validated['estado'],
            'impresion_principal' => $validated['impresion_principal'] ?? false,
            'nombre_impresora' => $validated['nombre_impresora'] ?? null,
            'ciudad_id' => $request->ciudad_id ?? null,
            'fecha_vencimiento' => $validated['fecha_vencimiento'] ?? null,
        ]);

        if (!empty($validated['password'])) {
            $usuario->update(['password' => Hash::make($validated['password'])]);
        }

        $usuario->syncRoles($validated['role']);

        // Update subscription price if not manually provided in the request
        if (!isset($request->precio_suscripcion)) {
            $usuario->update(['precio_suscripcion' => $usuario->calculateSubscriptionPrice()]);
        } else {
            $usuario->update(['precio_suscripcion' => $validated['precio_suscripcion']]);
        }

        return new UserResource($usuario->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $usuario)
    {
        $usuario->delete();
        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }
}
