<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'ver dashboard',
            'gestionar usuarios',
            'gestionar roles',
            'ver inventario',
            'gestionar inventario',
            'realizar ventas',
            'ver reportes',
            'gestionar configuracion',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions
        
        // Superadmin: gets all permissions (via Gate::before in AppServiceProvider)
        Role::firstOrCreate(['name' => 'superadmin']);

        // Admin: most permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Local: sales and inventory view
        $localRole = Role::firstOrCreate(['name' => 'local']);
        $localRole->givePermissionTo([
            'ver dashboard',
            'ver inventario',
            'realizar ventas',
        ]);

        // Bodega: inventory management
        $bodegaRole = Role::firstOrCreate(['name' => 'bodega']);
        $bodegaRole->givePermissionTo([
            'ver dashboard',
            'ver inventario',
            'gestionar inventario',
        ]);
    }
}
