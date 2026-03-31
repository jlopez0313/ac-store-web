<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    use HasFactory, Blameable;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'proveedores';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'cuenta_id',
        'nombre',
        'tipo_documento',
        'documento',
        'telefono',
        'correo',
    ];

    /**
     * Get the account that owns the provider.
     */
    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }
}
