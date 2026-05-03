<?php

namespace App\Http\Controllers;

use App\Models\Bodega;
use App\Models\BodegaAcceso;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsuarioAccesoController extends Controller
{
    public function index(Request $request, User $usuario)
    {
        $user = auth()->user();

        // Security Check: Only superadmin or admin of the same account
        if (!$user->hasRole('superadmin') && ($user->cuenta_id !== $usuario->cuenta_id || $user->role !== 'admin')) {
            abort(403, 'No tienes permiso para gestionar los accesos de este usuario.');
        }

        // Must be a local user
        if (!$usuario->hasRole('local')) {
            abort(404, 'El usuario no tiene el rol local.');
        }

        return Inertia::render('usuarios/Accesos', [
            'usuario' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'username' => $usuario->username,
            ]
        ]);
    }

    public function update(Request $request, User $usuario, $bodega_id)
    {
        $user = auth()->user();

        if (!$user->hasRole('superadmin') && ($user->cuenta_id !== $usuario->cuenta_id || $user->role !== 'admin')) {
            abort(403);
        }

        $request->validate([
            'can_view' => 'required|boolean',
            'can_order' => 'required|boolean',
            'descuento' => 'nullable|numeric|min:0',
        ]);

        $bodega = Bodega::findOrFail($bodega_id);

        if (!$request->can_view && !$request->can_order && ($request->descuento == 0 || $request->descuento == null)) {
             BodegaAcceso::where('bodega_id', $bodega_id)
                ->where('user_id', $usuario->id)
                ->delete();
        } else {
            BodegaAcceso::withTrashed()->updateOrCreate(
                ['bodega_id' => $bodega_id, 'user_id' => $usuario->id],
                [
                    'can_view' => $request->can_view,
                    'can_order' => $request->can_order,
                    'descuento' => $request->descuento ?? 0,
                    'cuenta_id' => $bodega->cuenta_id,
                    'deleted_at' => null
                ]
            );
        }

        // Update user subscription price
        $newPrice = $usuario->calculateSubscriptionPrice();
        $usuario->update(['precio_suscripcion' => $newPrice]);

        return back()->with('success', 'Permisos actualizados correctamente.');
    }
}
