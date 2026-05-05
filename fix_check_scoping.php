<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$sebas = DB::table('users')->where('id', 122)->first();
echo "Usuario Sebas Amaya - ID: {$sebas->id} | Cuenta ID: " . ($sebas->cuenta_id ?? 'NULL') . "\n";

$trashed = DB::table('venta_detalles')
    ->join('ventas', 'venta_detalles.venta_id', '=', 'ventas.id')
    ->whereNotNull('venta_detalles.deleted_at')
    ->select('ventas.id as venta_id', 'ventas.cuenta_id')
    ->get();

echo "\n--- Registros de Devolución detectados ---\n";
foreach ($trashed as $t) {
    echo "Factura #{$t->venta_id} | Cuenta ID en la Venta: {$t->cuenta_id}\n";
    
    if ($sebas->cuenta_id == $t->cuenta_id) {
        echo " >> ¡COINCIDEN! Este registro debería ser visible para Sebas.\n";
    } else {
        echo " >> NO COINCIDEN. Diferentes cuentas.\n";
    }
}
