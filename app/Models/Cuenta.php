<?php

namespace App\Models;

use App\Observers\CuentaObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(CuentaObserver::class)]
class Cuenta extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nombre',
        'estado',
        'precio_suscripcion',
        'fecha_vencimiento',
        'horarios_ventas',
        'bloquear_festivos',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'fecha_vencimiento' => 'date',
        'horarios_ventas' => 'array',
        'bloquear_festivos' => 'boolean',
    ];

    public function getHorariosVentasOrDefault(): array
    {
        return $this->horarios_ventas ?? [
            'monday' => [['08:00', '17:00']],
            'tuesday' => [['08:00', '17:00']],
            'wednesday' => [['08:00', '17:00']],
            'thursday' => [['08:00', '17:00']],
            'friday' => [['08:00', '17:00']],
            'saturday' => [['08:00', '17:00']],
            'sunday' => [],
        ];
    }

    public function getDbViewCredentials(): array
    {
        $rawName = str_replace(' ', '', $this->nombre);
        $username = strtolower(preg_replace('/[^A-Za-z0-9]/', '', $rawName));
        $username = substr($username, 0, 32);

        return [
            'username' => $username,
            'password' => ucfirst($username) . "@2026",
        ];
    }
}
