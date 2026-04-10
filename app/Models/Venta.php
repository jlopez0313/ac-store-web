<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    use HasFactory, Blameable;

    protected $fillable = [
        'user_id',
        'cuenta_id',
        'fecha',
        'estado',
        'observaciones',
        'subtotal',
        'total',
    ];

    protected $casts = [
        'fecha' => 'date',
        'subtotal' => 'integer',
        'total' => 'integer',
    ];

    public function local()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class, 'cuenta_id');
    }

    public function detalles()
    {
        return $this->hasMany(VentaDetalle::class, 'venta_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
