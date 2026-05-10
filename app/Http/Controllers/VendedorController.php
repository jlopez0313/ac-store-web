<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Cuenta;
use Inertia\Inertia;
use Illuminate\Http\Request;

class VendedorController extends Controller
{
    public function index(User $usuario)
    {
        // Security Check: Only superadmin or admin of the same account
        $user = auth()->user();
        if (!$user->hasRole('superadmin') && ($user->cuenta_id !== $usuario->cuenta_id || $user->role !== 'admin')) {
            abort(403, 'No tienes permiso para gestionar los vendedores de este usuario.');
        }

        // Must be a local user
        if (!$usuario->hasRole('local')) {
            abort(404, 'El usuario no tiene el rol local.');
        }

        return Inertia::render('usuarios/Vendedores', [
            'targetUser' => $usuario->load('cuenta'),
            'cuentas' => $user->hasRole('superadmin') ? Cuenta::orderBy('nombre')->get(['id', 'nombre']) : [],
            'locals' => User::role('local')->where('cuenta_id', $user->hasRole('superadmin') ? ($usuario->cuenta_id ?? null) : $user->cuenta_id)->orderBy('name', 'asc')->get(['id', 'name', 'cuenta_id']),
        ]);
    }

    public function all()
    {
        $user = auth()->user();
        
        return Inertia::render('usuarios/Vendedores', [
            'targetUser' => null,
            'cuentas' => $user->hasRole('superadmin') ? Cuenta::orderBy('nombre')->get(['id', 'nombre']) : [],
            'locals' => User::role('local')->when(!$user->hasRole('superadmin'), function($q) use ($user) {
                return $q->where('cuenta_id', $user->cuenta_id);
            })->orderBy('name', 'asc')->get(['id', 'name', 'cuenta_id']),
        ]);
    }
}
