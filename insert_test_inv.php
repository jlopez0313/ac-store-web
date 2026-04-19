<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Inventario;
use App\Models\Referencia;
use App\Models\Bodega;
use App\Models\Estanteria;

$ref = Referencia::where('cuenta_id', 1)->first();
$bodega = Bodega::where('cuenta_id', 1)->first();
$estanteria = Estanteria::where('bodega_id', $bodega->id)->where('nombre', 'GENERAL')->first();

if ($ref && $estanteria) {
    Inventario::create([
        'cuenta_id' => 1,
        'referencia_id' => $ref->id,
        'estanteria_id' => $estanteria->id,
        'talla' => 'TEST',
        'stock' => 10,
        'precio_venta' => 1000
    ]);
    echo "Inserted TEST inventory for ref " . $ref->codigo . "\n";
} else {
    echo "Could not find ref or estanteria\n";
}
