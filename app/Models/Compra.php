<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    use HasFactory, Blameable;

    protected $table = 'compras';

    protected $fillable = [
        'numero',
        'cuenta_id',
        'proveedor_id',
        'estado',         // 'abierta' o 'cerrada'
        'fecha_apertura',
        'fecha_cierre',
        'observaciones',
        'flete',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre'   => 'datetime',
    ];

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function detalles()
    {
        return $this->hasMany(CompraDetalle::class);
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class);
    }
}
