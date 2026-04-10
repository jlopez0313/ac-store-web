<?php

namespace App\Http\Controllers;

use App\Models\Bodega;
use App\Models\BodegaAcceso;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BodegaAccesoController extends Controller
{
    public function index(Request $request, Bodega $bodega)
    {
        $user = auth()->user();

        // Security Check: Only superadmin or admin of the same account
        if (!$user->hasRole('superadmin') && ($user->cuenta_id !== $bodega->cuenta_id || $user->role !== 'admin')) {
            abort(403, 'No tienes permiso para gestionar los accesos de esta bodega.');
        }

        // Get users with role 'local'
        $query = User::role('local');
        $query->orderBy('name');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $localesUsers = $query->get();

        // Get current access permissions for the target bodega
        $accesos = BodegaAcceso::where('bodega_id', $bodega->id)->get()->keyBy('user_id');

        // Merge permissions into data
        $lista = $localesUsers->map(function ($localUser) use ($accesos) {
            $acceso = $accesos->get($localUser->id);
            return [
                'id' => $localUser->id,
                'nombre' => $localUser->name,
                'username' => $localUser->username,
                'email' => $localUser->email,
                'cuenta_nombre' => $localUser->cuenta?->nombre ?? 'N/A',
                'can_view' => $acceso ? (bool) $acceso->can_view : false,
                'can_order' => $acceso ? (bool) $acceso->can_order : false,
                'descuento' => $acceso ? (float) $acceso->descuento : 0,
            ];
        });

        return Inertia::render('bodegas/Accesos', [
            'bodega' => [
                'id' => $bodega->id,
                'nombre' => $bodega->nombre,
            ],
            'lista' => $lista,
            'filters' => $request->only(['search']),
        ]);
    }

    public function update(Request $request, Bodega $bodega, $user_id)
    {
        $user = auth()->user();

        if (!$user->hasRole('superadmin') && ($user->cuenta_id !== $bodega->cuenta_id || $user->role !== 'admin')) {
            abort(403);
        }

        $request->validate([
            'can_view' => 'required|boolean',
            'can_order' => 'required|boolean',
            'descuento' => 'nullable|numeric|min:0',
        ]);

        BodegaAcceso::updateOrCreate(
            ['bodega_id' => $bodega->id, 'user_id' => $user_id],
            [
                'can_view' => $request->can_view,
                'can_order' => $request->can_order,
                'descuento' => $request->descuento ?? 0,
                'cuenta_id' => $bodega->cuenta_id
            ]
        );

        return back()->with('success', 'Permisos actualizados correctamente.');
    }
}
