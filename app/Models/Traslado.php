<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Traslado extends Model
{
    use HasFactory;

    protected $fillable = [
        'cuenta_id',
        'referencia_id',
        'talla',
        'bodega_origen_id',
        'estanteria_origen_id',
        'bodega_destino_id',
        'estanteria_destino_id',
        'cantidad',
        'user_id',
    ];

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function bodegaOrigen()
    {
        return $this->belongsTo(Bodega::class, 'bodega_origen_id');
    }

    public function estanteriaOrigen()
    {
        return $this->belongsTo(Estanteria::class, 'estanteria_origen_id');
    }

    public function bodegaDestino()
    {
        return $this->belongsTo(Bodega::class, 'bodega_destino_id');
    }

    public function estanteriaDestino()
    {
        return $this->belongsTo(Estanteria::class, 'estanteria_destino_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
