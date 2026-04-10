<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    use HasFactory, Blameable;

    protected $fillable = [
        'cuenta_id',
        'referencia_id',
        'bodega_id',
        'compra_id',
        'compra_detalle_id',
        'pares_por_caja',
        'cantidad',
        'precio_compra',
        'precio_venta',
    ];

    protected $casts = [
        'precio_compra' => 'integer',
        'precio_venta' => 'integer',
    ];

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class);
    }

    public function compra()
    {
        return $this->belongsTo(Compra::class);
    }

    public function detalle()
    {
        return $this->belongsTo(CompraDetalle::class, 'compra_detalle_id');
    }
}
