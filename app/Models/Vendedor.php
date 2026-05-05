<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vendedor extends Model
{
    use Blameable;

    protected $table = 'vendedores';

    protected $fillable = [
        'cuenta_id',
        'user_id',
        'nombre',
        'documento',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
