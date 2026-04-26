<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Model;

class Muestra extends Model
{
    use Blameable;

    protected $fillable = [
        'local_id',
        'referencia_id',
        'inventario_id',
        'variante',
        'etiquetas',
        'cuenta_id',
        'estado',
        'impreso',
    ];

    protected $casts = [
        'etiquetas' => 'array',
        'impreso' => 'boolean',
    ];

    protected static function booted()
    {
        static::created(function ($muestra) {
            // Mark all other samples of this account as printed
            self::where('cuenta_id', $muestra->cuenta_id)
                ->where('id', '!=', $muestra->id)
                ->where('impreso', false)
                ->update(['impreso' => true]);
        });
    }

    public function local()
    {
        return $this->belongsTo(User::class, 'local_id');
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function inventario()
    {
        return $this->belongsTo(Inventario::class);
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }
}
