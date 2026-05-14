<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bodega extends Model
{
    use HasFactory, Blameable;

    protected $fillable = [
        'nombre',
        'direccion',
        'estado',
        'imprimir_traslados',
        'cuenta_id',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'imprimir_traslados' => 'boolean',
    ];

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function estanterias()
    {
        return $this->hasMany(Estanteria::class);
    }

    public function bodegaAccesos()
    {
        return $this->hasMany(BodegaAcceso::class, 'bodega_id');
    }
}
