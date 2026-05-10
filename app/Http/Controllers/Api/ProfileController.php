<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\UserPayment;
use App\Models\BodegaAcceso;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load(['cuenta', 'bodegaAccesos.bodega.cuenta', 'payments.registeredBy']);

        // Format bodega permissions
        $permissions = $user->bodegaAccesos->map(function ($acceso) {
            return [
                'id' => $acceso->id,
                'bodega_id' => $acceso->bodega_id,
                'bodega_nombre' => $acceso->bodega->nombre,
                'cuenta_nombre' => $acceso->bodega->cuenta->nombre,
                'can_view' => (bool)$acceso->can_view,
                'can_order' => (bool)$acceso->can_order,
                'descuento' => $acceso->descuento,
                'precio_acceso' => (float) config('constantes.suscripciones.default_user_price', 120000), // Default per account, but could be customized
            ];
        });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'precio_suscripcion' => $user->precio_suscripcion,
                'fecha_vencimiento' => $user->fecha_vencimiento ? $user->fecha_vencimiento->format('Y-m-d') : null,
            ],
            'permissions' => $permissions,
            'payments' => $user->payments->map(function ($p) {
                return [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'payment_date' => $p->payment_date->format('Y-m-d'),
                    'next_cutoff_date' => $p->next_cutoff_date ? $p->next_cutoff_date->format('Y-m-d') : null,
                    'observations' => $p->observations,
                    'registered_by' => $p->registeredBy->name ?? 'N/A',
                ];
            }),
            'contacts' => config('constantes.plataforma.contacto'),
            'payment_methods' => config('constantes.plataforma.metodos_pago'),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $baseUsername = $request->username;
        $username = $baseUsername;
        $count = 1;

        // Auto-increment logic for username
        while (User::where('username', $username)->where('id', '!=', $user->id)->exists()) {
            $username = $baseUsername . str_pad($count, 2, '0', STR_PAD_LEFT);
            $count++;
        }

        $user->name = $request->name;
        $user->username = $username;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado correctamente.',
            'username' => $user->username,
        ]);
    }
}
