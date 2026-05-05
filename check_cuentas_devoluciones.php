<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// 1. Ver los registros eliminados y su cuenta
$trashed = DB::table('venta_detalles')
    ->join('ventas', 'venta_detalles.venta_id', '=', 'ventas.id')
    ->join('cuentas', 'ventas.cuenta_id', '=', 'cuentas.id')
    ->whereNotNull('venta_detalles.deleted_at')
    ->select('ventas.id as venta_id', 'ventas.cuenta_id', 'cuentas.nombre as cuenta_nombre')
    ->get();

echo "--- Registros de Devolución ---\n";
foreach ($trashed as $t) {
    echo "Factura: #{$t->venta_id} | Cuenta ID: {$t->cuenta_id} | Nombre: {$t->cuenta_nombre}\n";
}

echo "\n--- Usuarios Admin/Bodega ---\n";
$users = DB::table('users')
    ->whereIn('role', ['admin', 'bodega'])
    ->select('id', 'name', 'role', 'cuenta_id')
    ->get();

foreach ($users as $u) {
    echo "Usuario: {$u->name} | Rol: {$u->role} | Cuenta ID: " . ($u->cuenta_id ?? 'NULL') . "\n";
}
