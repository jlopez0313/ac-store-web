<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportesController extends Controller
{
    public function ventas()
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $localesQuery = User::where('role', 'local');
        if (!$isSuper) {
            $localesQuery->where('cuenta_id', $user->cuenta_id);
        }

        return Inertia::render('reportes/Ventas', [
            'cuentas' => $isSuper ? Cuenta::all(['id', 'nombre']) : [],
            'locales' => $localesQuery->get(['id', 'name']),
        ]);
    }
}
