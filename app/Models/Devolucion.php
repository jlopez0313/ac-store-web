<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Devolucion extends Model
{
    use HasFactory, Blameable;

    protected $table = 'devoluciones';

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
        'fecha_devolucion',
    ];

    protected $casts = [
        'precio_unitario' => 'integer',
        'subtotal' => 'integer',
        'fecha_devolucion' => 'datetime',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function inventario()
    {
        return $this->belongsTo(Inventario::class);
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
}
