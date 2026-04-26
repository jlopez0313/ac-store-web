<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Referencia extends Model
{
    /** @use HasFactory<\Database\Factories\ReferenciaFactory> */
    use HasFactory, Blameable;

    protected $fillable = [
        'codigo',
        'marca_id',
        'descripcion',
        'categoria_id',
        'foto',
        'cuenta_id',
        'sistema_viejo',
        'impreso',
    ];

    protected $casts = [
        'sistema_viejo' => 'boolean',
        'impreso' => 'boolean',
    ];

    public function marca()
    {
        return $this->belongsTo(Marca::class);
    }

    /**
     * Get the category that owns the product.
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    /**
     * Get the account that owns the product.
     */
    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function inventarios()
    {
        return $this->hasMany(Inventario::class);
    }

    public function ventaDetalles()
    {
        return $this->hasMany(VentaDetalle::class, 'producto_id');
    }
}
