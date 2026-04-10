<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    use HasFactory, Blameable;

    protected $fillable = [
        'cuenta_id',
        'referencia_id',
        'estanteria_id',
        'talla',
        'stock',
        'subdivision_stock',
        'precio_compra',
        'precio_venta',
    ];

    protected $casts = [
        'precio_compra' => 'integer',
        'precio_venta' => 'integer',
        'subdivision_stock' => 'array',
    ];

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function estanteria()
    {
        return $this->belongsTo(Estanteria::class);
    }
}
