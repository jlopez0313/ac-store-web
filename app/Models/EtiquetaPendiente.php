<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EtiquetaPendiente extends Model
{
    protected $table = 'etiquetas_pendientes';

    protected $fillable = [
        'cuenta_id',
        'referencia_id',
        'estanteria_id',
        'talla',
        'cantidad',
        'impreso',
    ];

    protected $casts = [
        'impreso' => 'boolean',
    ];

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function estanteria()
    {
        return $this->belongsTo(Estanteria::class);
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }
}
