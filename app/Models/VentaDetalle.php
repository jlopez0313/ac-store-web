<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VentaDetalle extends Model
{
    use HasFactory;

    protected $table = 'venta_detalles';

    protected $casts = [
        'precio_unitario' => 'integer',
        'subtotal' => 'integer',
    ];

    protected $fillable = [
        'venta_id',
        'inventario_id',
        'producto_id',
        'bodega_id',
        'estanteria_id',
        'talla',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'muestra_id',
        'estado',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function producto()
    {
        return $this->belongsTo(Referencia::class, 'producto_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class);
    }

    public function estanteria()
    {
        return $this->belongsTo(Estanteria::class);
    }

    public function inventario()
    {
        return $this->belongsTo(Inventario::class);
    }

    public function muestra()
    {
        return $this->belongsTo(Muestra::class);
    }
}
