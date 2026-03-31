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
        'marca',
        'descripcion',
        'categoria_id',
        'foto',
        'cuenta_id',
    ];

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
}
