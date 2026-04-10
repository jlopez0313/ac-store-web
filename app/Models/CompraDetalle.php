<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Blameable;

class CompraDetalle extends Model
{
    use Blameable;

    protected $fillable = [
        'compra_id',
        'referencia_id',
        'bodega_id',
        'modo',
        'numero_cajas',
        'pares_por_caja',
        'cantidad',
        'precio_unitario',
        'precio_venta',
        'tallas',
        'subtotal'
    ];

    protected $casts = [
        'tallas' => 'array',
        'precio_unitario' => 'integer',
        'precio_venta' => 'integer',
        'subtotal' => 'integer',
    ];

    public function compra()
    {
        return $this->belongsTo(Compra::class);
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class);
    }

    public function producto()
    {
        return $this->belongsTo(Referencia::class, 'referencia_id'); // alias for frontend matching
    }
}
