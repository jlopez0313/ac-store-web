<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    /** @use HasFactory<\Database\Factories\CategoriaFactory> */
    use HasFactory, Blameable;

    protected $fillable = [
        'nombre',
        'tipo_control',
        'subdivision_stock',
        'variaciones_json',
        'prefijo_sku',
    ];

    protected $casts = [
        'subdivision_stock' => 'array',
        'variaciones_json'  => 'array',
    ];
}
