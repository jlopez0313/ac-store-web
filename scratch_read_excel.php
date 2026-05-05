<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Jobs\ImportarSistemaViejoJob;
use PhpOffice\PhpSpreadsheet\IOFactory;

// We need the file path. Let's find it in the DB or logs?
// The user just ran it, so it's probably the last uploaded file.
$filePath = 'storage/app/importacion/import_temp.xlsx'; // Common name? No.
// Let's look for files in storage/app/importacion
$files = glob('storage/app/importacion/*.xlsx');
$filePath = end($files);

if (!$filePath) {
    echo "No se encontró el archivo Excel en storage/app/importacion/\n";
    exit;
}

echo "Leyendo archivo: $filePath\n";

$spreadsheet = IOFactory::load($filePath);
$sheet = $spreadsheet->getSheetByName('FACTURAS_VENTAS');
if (!$sheet) {
    echo "Hoja FACTURAS_VENTAS no encontrada\n";
    exit;
}

$rows = $sheet->toArray();
foreach ($rows as $i => $row) {
    if ($row[0] == '14013') {
        echo "Fila Factura 14013:\n";
        print_r($row);
        break;
    }
}
