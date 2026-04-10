<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\Cuenta;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UsuariosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'cuenta'])->orderBy('name');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('username', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('role')) {
            $query->role($request->role);
        }

        if ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        return Inertia::render('usuarios/Index', [
            'filters' => $request->only(['search', 'role', 'cuenta_id', 'per_page']),
            'lista'   => UserResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
            'roles'   => Role::orderBy('name')->get()->map(fn($role) => ['id' => $role->name, 'name' => $role->name]),
            'cuentas' => Cuenta::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre as name']),
            'estados' => config('constantes.estados'),
        ]);
    }
}
