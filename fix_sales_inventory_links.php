<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Iniciando reparación de vínculos de inventario en ventas...\n";

$count = 0;
$fixed = 0;

// Obtener detalles de venta sin inventario_id
$detalles = DB::table('venta_detalles')
    ->join('ventas', 'venta_detalles.venta_id', '=', 'ventas.id')
    ->whereNull('venta_detalles.inventario_id')
    ->select('venta_detalles.*', 'ventas.cuenta_id')
    ->get();

echo "Encontrados " . $detalles->count() . " detalles sin vínculo.\n";

foreach ($detalles as $d) {
    $count++;
    
    // Buscar el inventario correspondiente
    $inv = DB::table('inventarios')
        ->where('cuenta_id', $d->cuenta_id)
        ->where('referencia_id', $d->producto_id)
        ->where('talla', $d->talla)
        ->first();
        
    if ($inv) {
        DB::table('venta_detalles')
            ->where('id', $d->id)
            ->update(['inventario_id' => $inv->id]);
        $fixed++;
    }
}

echo "Proceso terminado.\n";
echo "Total revisados: $count\n";
echo "Total vinculados: $fixed\n";
