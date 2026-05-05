<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Iniciando reparación MASIVA de vínculos de inventario...\n";

$sql = "
    UPDATE venta_detalles vd
    JOIN ventas v ON vd.venta_id = v.id
    JOIN inventarios i ON i.cuenta_id = v.cuenta_id 
        AND i.referencia_id = vd.producto_id 
        AND i.talla = vd.talla
    SET vd.inventario_id = i.id
    WHERE vd.inventario_id IS NULL
";

$affected = DB::update($sql);

echo "Proceso terminado.\n";
echo "Registros vinculados exitosamente: $affected\n";
