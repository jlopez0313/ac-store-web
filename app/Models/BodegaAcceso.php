<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BodegaAcceso extends Model
{
    use HasFactory, Blameable;

    protected $table = 'bodega_accesos';

    protected $fillable = [
        'bodega_id',
        'user_id',
        'can_view',
        'can_order',
        'descuento',
        'cuenta_id',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_order' => 'boolean',
        'descuento' => 'integer',
    ];

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
