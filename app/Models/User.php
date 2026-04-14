<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Traits\Blameable;
use App\Traits\HasRole;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRole, Blameable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'cuenta_id',
        'estado',
        'ciudad_id',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's first role name.
     */
    public function getRoleAttribute(): ?string
    {
        return $this->getRoleNames()->first();
    }

    /**
     * Get the account that owns the user.
     */
    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    /**
     * Get the warehouse accesses for the user.
     */
    public function bodegaAccesos()
    {
        return $this->hasMany(BodegaAcceso::class, 'user_id');
    }

    /**
     * Get the city where the user is located.
     */
    public function ciudad()
    {
        return $this->belongsTo(\Nnjeim\World\Models\City::class, 'ciudad_id');
    }

    /**
     * Get the sales where the user is the customer/local.
     */
    public function ventas()
    {
        return $this->hasMany(Venta::class, 'user_id');
    }
}
