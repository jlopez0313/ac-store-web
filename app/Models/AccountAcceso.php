<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountAcceso extends Model
{
    protected $table = 'account_accesos';

    protected $fillable = [
        'user_id',
        'cuenta_id',
        'custom_price',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }
}
