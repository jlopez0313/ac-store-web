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
        'documento',
        'email',
        'password',
        'cuenta_id',
        'estado',
        'impresion_principal',
        'nombre_impresora',
        'ciudad_id',
        'precio_suscripcion',
        'fecha_vencimiento',
        'maneja_vendedores',
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
            'fecha_vencimiento' => 'date',
            'impresion_principal' => 'boolean',
            'maneja_vendedores' => 'boolean',
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
     * Get the warehouses the user has access to.
     */
    public function bodegas()
    {
        return $this->belongsToMany(Bodega::class, 'bodega_accesos', 'user_id', 'bodega_id');
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

    public function accountAccesos()
    {
        return $this->hasMany(AccountAcceso::class);
    }

    public function payments()
    {
        return $this->hasMany(UserPayment::class, 'user_id');
    }

    /**
     * Get the number of unique accounts the user has bodega access to.
     */
    public function getWarehouseAccountCount(): int
    {
        return $this->bodegaAccesos()
            ->join('bodegas', 'bodega_accesos.bodega_id', '=', 'bodegas.id')
            ->distinct('bodegas.cuenta_id')
            ->count('bodegas.cuenta_id');
    }

    /**
     * Calculate the subscription price based on the role and warehouse access.
     */
    public function calculateSubscriptionPrice(): float
    {
        if ($this->hasRole('superadmin')) {
            return 0; // Superadmins don't pay? Or fixed price.
        }

        if ($this->role === 'local') {
            $accountIds = $this->getAccessibleAccountIds();
            $total = 0;
            $defaultPrice = (float) config('constantes.suscripciones.default_user_price', 120000);

            foreach ($accountIds as $cuentaId) {
                $custom = $this->accountAccesos()->where('cuenta_id', $cuentaId)->first();
                if ($custom && $custom->custom_price !== null) {
                    $total += $custom->custom_price;
                } else {
                    $total += $defaultPrice;
                }
            }
            return $total;
        }

        return (float) config('constantes.suscripciones.default_user_price', 120000);
    }

    /**
     * Get IDs of all accounts the user has warehouse access to.
     */
    public function getAccessibleAccountIds(): array
    {
        if ($this->hasRole('superadmin')) {
            return \App\Models\Cuenta::pluck('id')->toArray();
        }

        // Always include their primary account
        $ids = [$this->cuenta_id];

        // Add accounts from warehouse access
        $warehouseAccountIds = \App\Models\BodegaAcceso::where('user_id', $this->id)
            ->join('bodegas', 'bodega_accesos.bodega_id', '=', 'bodegas.id')
            ->pluck('bodegas.cuenta_id')
            ->toArray();

        return array_unique(array_filter(array_merge($ids, $warehouseAccountIds)));
    }

    /**
     * Sync account_accesos based on current bodega_accesos.
     */
    public function syncAccountAccesos()
    {
        $accountIds = $this->getAccessibleAccountIds();
        
        foreach ($accountIds as $cuentaId) {
            AccountAcceso::firstOrCreate(
                ['user_id' => $this->id, 'cuenta_id' => $cuentaId],
                ['custom_price' => null]
            );
        }

        // Update total price
        $this->update(['precio_suscripcion' => $this->calculateSubscriptionPrice()]);
    }

    /**
     * Get the notifications for the user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
