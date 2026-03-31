<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Estanteria extends Model
{
    use HasFactory, Blameable;

    protected $fillable = [
        'bodega_id',
        'nombre',
        'descripcion',
        'estado',
    ];

    public function bodega()
    {
        return $this->belongsTo(Bodega::class);
    }
}
