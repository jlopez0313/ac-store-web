<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    use HasFactory, Blameable;

    protected $fillable = [
        'nombre',
        'cuenta_id',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (auth()->check() && !auth()->user()->hasRole('superadmin')) {
                $model->cuenta_id = auth()->user()->cuenta_id;
            }
        });
    }

    public function referencias()
    {
        return $this->hasMany(Referencia::class, 'marca_id');
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }
}
