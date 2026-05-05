<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$user = DB::table('users')->whereNotNull('cuenta_id')->first();
if (!$user) {
    echo "No se encontró ningún usuario con cuenta_id.\n";
    exit;
}

echo "Prueba con Usuario: " . $user->name . " (Cuenta ID: " . $user->cuenta_id . ")\n";

$totalTrashed = DB::table('venta_detalles')
    ->whereNotNull('deleted_at')
    ->count();

$accountTrashed = DB::table('venta_detalles')
    ->join('ventas', 'venta_detalles.venta_id', '=', 'ventas.id')
    ->whereNotNull('venta_detalles.deleted_at')
    ->where('ventas.cuenta_id', $user->cuenta_id)
    ->count();

echo "Total devoluciones en el sistema: $totalTrashed\n";
echo "Devoluciones de tu cuenta: $accountTrashed\n";
