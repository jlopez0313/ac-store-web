<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class SuscripcionesController extends Controller
{
    /**
     * Display a listing of subscriptions and totals.
     */
    public function index(Request $request)
    {
        $now = Carbon::now();

        // 1. Totals for Cards
        $totalCuentas = Cuenta::where('estado', 1)
            ->sum('precio_suscripcion');

        $totalLocales = User::role('local')
            ->where('estado', 1)
            ->sum('precio_suscripcion');

        $totalGeneral = $totalCuentas + $totalLocales;

        // 2. Active Accounts List
        $cuentasActivas = Cuenta::where('estado', 1)
            ->orderBy('nombre')
            ->paginate(10, ['*'], 'activas_page')
            ->withQueryString();

        // 3. Inactive or Expired Accounts
        $cuentasInactivas = Cuenta::where(function($q) use ($now) {
                $q->where('estado', 0)
                  ->orWhere('fecha_vencimiento', '<', $now->toDateString());
            })
            ->orderBy('nombre')
            ->paginate(10, ['*'], 'inactivas_page')
            ->withQueryString();

        // 4. Active Users (Local)
        $usuariosActivos = User::role('local')
            ->where('estado', 1)
            ->where(function($q) use ($now) {
                $q->whereNull('fecha_vencimiento')
                  ->orWhere('fecha_vencimiento', '>=', $now->toDateString());
            })
            ->orderBy('name')
            ->paginate(10, ['*'], 'usuarios_activos_page')
            ->withQueryString();

        // 5. Inactive or Expired Users (Local)
        $usuariosInactivos = User::role('local')
            ->where(function($q) use ($now) {
                $q->where('estado', 0)
                  ->orWhere('fecha_vencimiento', '<', $now->toDateString());
            })
            ->orderBy('name')
            ->paginate(10, ['*'], 'usuarios_inactivos_page')
            ->withQueryString();

        return Inertia::render('subscriptions/Report', [
            'totals' => [
                'cuentas' => (float)$totalCuentas,
                'locales' => (float)$totalLocales,
                'general' => (float)$totalGeneral,
            ],
            'active_accounts' => $cuentasActivas,
            'inactive_accounts' => $cuentasInactivas,
            'active_users' => $usuariosActivos,
            'inactive_users' => $usuariosInactivos,
        ]);
    }
}

