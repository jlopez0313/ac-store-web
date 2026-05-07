<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledMessage extends Model
{
    use HasFactory;

    protected $table = 'scheduled_messages';

    protected $fillable = [
        'cuenta_id',
        'userId',
        'recipient',
        'referenceCode',
        'message',
        'media',
        'scheduledTime',
        'dynamicUrl',
        'dynamicHeaders',
        'status',
        'error',
    ];

    protected $casts = [
        'scheduledTime' => 'datetime',
    ];
}
