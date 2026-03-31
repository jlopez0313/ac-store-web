<?php

namespace App\Traits;

use Spatie\Permission\Traits\HasRoles;

trait HasRole
{
    use HasRoles;

    public function hasRole(string|object $role): bool
    {
        $userRoleValue = $this->rol?->name ?? $this->getRoleNames()->first();

        if (empty($userRoleValue)) {
            return false;
        }

        if (is_string($role)) {
            return $userRoleValue === $role;
        }

        return $userRoleValue === $role->value;
    }

    /**
     * Check if the user is a superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('superadmin');
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if the user is a bodega user.
     */
    public function isBodega(): bool
    {
        return $this->hasRole('bodega');
    }

    /**
     * Check if the user is a local user.
     */
    public function isLocal(): bool
    {
        return $this->hasRole('local');
    }
}
