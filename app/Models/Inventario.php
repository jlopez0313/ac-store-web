<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Referencia;

class Inventario extends Model
{
    use HasFactory, Blameable;

    protected static $wipePerformed = false;
    
    protected static function booted()
    {
        static::saved(function ($inventario) {
            // Check if stock increased or it's a new record with stock > 0
            $isNew = $inventario->wasRecentlyCreated;
            $stockIncreased = false;

            if ($isNew) {
                if ($inventario->stock > 0) {
                    $stockIncreased = true;
                }
            } else if ($inventario->isDirty('stock')) {
                $oldStock = $inventario->getOriginal('stock') ?? 0;
                if ($inventario->stock > $oldStock) {
                    $stockIncreased = true;
                }
            }

            if ($stockIncreased) {
                if (!static::$wipePerformed) {
                    // Mark ALL references of this account as printed
                    Referencia::where('cuenta_id', $inventario->cuenta_id)
                        ->where('impreso', false)
                        ->update(['impreso' => true]);
                    
                    static::$wipePerformed = true;
                }

                // Mark current reference as NOT printed
                $referencia = $inventario->referencia;
                if ($referencia) {
                    $referencia->update(['impreso' => false]);
                }
            }
        });
    }

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
