<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AjusteInventario extends Model
{
    use HasFactory, Blameable;

    protected $table = 'ajuste_inventarios';

    protected $fillable = [
        'referencia_id',
        'estanteria_id',
        'precio_compra_anterior',
        'precio_compra_nuevo',
        'precio_venta_anterior',
        'precio_venta_nuevo',
        'detalle_stock',
        'observacion',
    ];

    protected $casts = [
        'detalle_stock' => 'array',
        'precio_compra_anterior' => 'integer',
        'precio_compra_nuevo' => 'integer',
        'precio_venta_anterior' => 'integer',
        'precio_venta_nuevo' => 'integer',
    ];

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function estanteria()
    {
        return $this->belongsTo(Estanteria::class);
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
