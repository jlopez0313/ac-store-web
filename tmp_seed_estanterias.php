<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bodega;

Bodega::all()->each(function($b) {
    if ($b->estanterias()->count() === 0) {
        $b->estanterias()->createMany([
            ['nombre' => 'Estante A1'],
            ['nombre' => 'Estante B2'],
            ['nombre' => 'Pasillo Central']
        ]);
        echo "Bodega {$b->id}: Estanterías creadas.\n";
    } else {
        echo "Bodega {$b->id}: Ya tiene estanterías.\n";
    }
});
