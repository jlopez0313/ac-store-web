<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Muestra;

$muestra = Muestra::with(['inventario.estanteria.bodega'])->find(3);

if ($muestra) {
    echo "ID: " . $muestra->id . "\n";
    echo "Inventario ID: " . $muestra->inventario_id . "\n";
    echo "Inventario: " . ($muestra->inventario ? "OK" : "NULL") . "\n";
    if ($muestra->inventario) {
        echo "Estanteria ID: " . $muestra->inventario->estanteria_id . "\n";
        echo "Estanteria: " . ($muestra->inventario->estanteria ? "OK" : "NULL") . "\n";
        if ($muestra->inventario->estanteria) {
            echo "Bodega ID: " . $muestra->inventario->estanteria->bodega_id . "\n";
            echo "Bodega: " . ($muestra->inventario->estanteria->bodega ? $muestra->inventario->estanteria->bodega->nombre : "NULL") . "\n";
        }
    }
    echo "Estado: " . $muestra->estado . "\n";
} else {
    echo "Muestra not found\n";
}
