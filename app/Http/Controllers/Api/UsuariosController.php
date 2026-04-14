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
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|exists:roles,name',
            'cuenta_id' => 'nullable|exists:cuentas,id',
            'estado' => 'required|boolean',
            'ciudad_id' => 'nullable|exists:cities,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'cuenta_id' => $validated['cuenta_id'],
            'estado' => $validated['estado'],
            'ciudad_id' => $request->ciudad_id ?? null,
        ]);

        $user->syncRoles($validated['role']);

        return new UserResource($user);
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
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($usuario->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'required|exists:roles,name',
            'cuenta_id' => 'nullable|exists:cuentas,id',
            'estado' => 'required|boolean',
            'ciudad_id' => 'nullable|exists:cities,id',
        ]);

        $usuario->update([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'cuenta_id' => $validated['cuenta_id'],
            'estado' => $validated['estado'],
            'ciudad_id' => $request->ciudad_id ?? null,
        ]);

        if (!empty($validated['password'])) {
            $usuario->update(['password' => Hash::make($validated['password'])]);
        }

        $usuario->syncRoles($validated['role']);

        return new UserResource($usuario);
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
