<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Inventario;
use App\Models\Referencia;
use App\Models\Bodega;

echo "Inventarios: " . Inventario::count() . "\n";
echo "Referencias (Cuenta 1): " . Referencia::where('cuenta_id', 1)->count() . "\n";
echo "Bodegas (Cuenta 1): " . Bodega::where('cuenta_id', 1)->count() . "\n";
echo "Sample Codigos: " . implode(', ', Referencia::where('cuenta_id', 1)->limit(5)->pluck('codigo')->toArray()) . "\n";
echo "Estanterias GENERAL (Cuenta 1): " . DB::table('estanterias')
    ->whereIn('bodega_id', Bodega::where('cuenta_id', 1)->pluck('id'))
    ->where('nombre', 'GENERAL')
    ->count() . "\n";
