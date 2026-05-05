<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = Illuminate\Support\Facades\DB::table('users')->where('name', 'VENTAS 1')->first();
if ($user) {
    echo "ID: " . $user->id . "\n";
    echo "Nombre: " . $user->name . "\n";
} else {
    echo "No se encontró VENTAS 1\n";
}

$venta = Illuminate\Support\Facades\DB::table('ventas')->where('numero', '14013')->first();
if ($venta) {
    echo "Venta 14013 - user_id: " . $venta->user_id . "\n";
    $assignedUser = Illuminate\Support\Facades\DB::table('users')->find($venta->user_id);
    echo "Asignada a: " . ($assignedUser ? $assignedUser->name : "N/A") . "\n";
} else {
    echo "Venta 14013 no encontrada\n";
}
