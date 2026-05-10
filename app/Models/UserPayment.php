<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPayment extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'payment_date',
        'next_cutoff_date',
        'observations',
        'registered_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'next_cutoff_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function registeredBy()
    {
        return $this->belongsTo(User::class, 'registered_by');
    }
}
