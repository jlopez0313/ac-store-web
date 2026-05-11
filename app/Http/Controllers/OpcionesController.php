<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpcionesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperadmin = $user->hasRole('superadmin');

        $cuenta = $this->resolveCuenta($user, $request);

        return Inertia::render('opciones/Index', [
            'cuentas' => $isSuperadmin ? Cuenta::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre']) : [],
            'cuenta_id' => $cuenta?->id,
        ]);
    }

    public function horarios(Request $request)
    {
        $user = $request->user();
        $isSuperadmin = $user->hasRole('superadmin');

        $cuenta = $this->resolveCuenta($user, $request);

        $defaults = [
            'monday' => [['08:00', '17:00']],
            'tuesday' => [['08:00', '17:00']],
            'wednesday' => [['08:00', '17:00']],
            'thursday' => [['08:00', '17:00']],
            'friday' => [['08:00', '17:00']],
            'saturday' => [['08:00', '17:00']],
            'sunday' => [],
        ];

        return Inertia::render('opciones/horarios', [
            'horarios_ventas' => $cuenta ? $cuenta->getHorariosVentasOrDefault() : $defaults,
            'bloquear_festivos' => $cuenta ? (bool) $cuenta->bloquear_festivos : true,
            'cuentas' => $isSuperadmin ? Cuenta::where('estado', 1)->orderBy('nombre')->get(['id', 'nombre']) : [],
            'cuenta_id' => $cuenta?->id,
        ]);
    }

    public function updateHorarios(Request $request)
    {
        $request->validate([
            'cuenta_id' => ['nullable', 'integer', 'exists:cuentas,id'],
            'horarios_ventas' => ['required', 'array'],
            'horarios_ventas.monday' => ['present', 'array'],
            'horarios_ventas.tuesday' => ['present', 'array'],
            'horarios_ventas.wednesday' => ['present', 'array'],
            'horarios_ventas.thursday' => ['present', 'array'],
            'horarios_ventas.friday' => ['present', 'array'],
            'horarios_ventas.saturday' => ['present', 'array'],
            'horarios_ventas.sunday' => ['present', 'array'],
            'horarios_ventas.*.*' => ['array', 'size:2'],
            'horarios_ventas.*.*.*' => ['string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'bloquear_festivos' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $cuenta = $this->resolveCuenta($user, $request);

        if (!$cuenta) {
            return back()->withErrors(['cuenta' => 'No hay una cuenta seleccionada.']);
        }

        // Normalizar horarios para que siempre sean HH:MM
        $horarios = $request->input('horarios_ventas');
        foreach ($horarios as $day => $ranges) {
            foreach ($ranges as $i => $range) {
                $horarios[$day][$i][0] = substr($range[0], 0, 5);
                $horarios[$day][$i][1] = substr($range[1], 0, 5);
            }
        }

        $cuenta->update([
            'horarios_ventas' => $horarios,
            'bloquear_festivos' => $request->input('bloquear_festivos'),
        ]);

        return back()->with('success', 'Horarios actualizados correctamente.');
    }

    private function resolveCuenta($user, Request $request): ?Cuenta
    {
        if ($user->hasRole('superadmin') && $request->filled('cuenta_id')) {
            return Cuenta::find($request->input('cuenta_id'));
        }

        return $user->cuenta;
    }
}
