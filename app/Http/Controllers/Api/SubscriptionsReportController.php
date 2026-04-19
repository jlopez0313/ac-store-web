<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cuenta;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SubscriptionsReportController extends Controller
{
    public function stats()
    {
        $now = Carbon::now();

        $totalCuentas = Cuenta::where('estado', 1)->sum('precio_suscripcion');
        $totalLocales = User::role('local')->where('estado', 1)->sum('precio_suscripcion');

        return response()->json([
            'cuentas' => (float)$totalCuentas,
            'locales' => (float)$totalLocales,
            'general' => (float)($totalCuentas + $totalLocales),
        ]);
    }

    public function getData(Request $request)
    {
        $type = $request->input('type'); // cuenta_activa, cuenta_inactiva, usuario_activo, usuario_inactiva
        $sortField = $request->input('sort_field', 'nombre');
        if ($type === 'usuario_activo' || $type === 'usuario_inactiva') {
            if ($sortField === 'nombre') $sortField = 'name';
        }
        $sortOrder = $request->input('sort_order', 'asc');
        $now = Carbon::now();

        if (str_starts_with($type, 'cuenta')) {
            $query = Cuenta::query();
            if ($type === 'cuenta_activa') {
                $query->where('estado', 1);
            } else {
                $query->where(function($q) use ($now) {
                    $q->where('estado', 0)
                      ->orWhere('fecha_vencimiento', '<', $now->toDateString());
                });
            }
        } else {
            $query = User::role('local');
            if ($type === 'usuario_activo') {
                $query->where('estado', 1)
                    ->where(function($q) use ($now) {
                        $q->whereNull('fecha_vencimiento')
                          ->orWhere('fecha_vencimiento', '>=', $now->toDateString());
                    });
            } else {
                $query->where(function($q) use ($now) {
                    $q->where('estado', 0)
                      ->orWhere('fecha_vencimiento', '<', $now->toDateString());
                });
            }
        }

        return $query->orderBy($sortField, $sortOrder)->paginate($request->input('per_page', 10));
    }
}
