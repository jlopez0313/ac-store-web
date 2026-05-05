<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sebas = \App\Models\User::find(122);
$venta = \App\Models\Venta::withTrashed()->find(14844);

echo "Sebas Cuenta ID: " . ($sebas ? $sebas->cuenta_id : 'No encontrado') . "\n";
echo "Venta Cuenta ID: " . ($venta ? $venta->cuenta_id : 'No encontrada') . "\n";

if ($sebas && $venta && $sebas->cuenta_id == $venta->cuenta_id) {
    echo "¡COINCIDEN!\n";
} else {
    echo "NO COINCIDEN o uno falta.\n";
}
