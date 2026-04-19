<?php

namespace App\Imports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class InventarioQueuedImport implements ToModel, WithChunkReading, SkipsEmptyRows
{
    public function __construct(private string $uploadId)
    {
    }

    public function model(array $row)
    {
        static $count = 0;
        $count++;

        if ($count % 10000 === 0) {
            \Illuminate\Support\Facades\Log::channel('importacion')->info("    > Inventario: {$count} filas leídas...");
        }

        if ($count <= 5) {
            \Illuminate\Support\Facades\Log::channel('importacion')->info("DEBUG ROW: " . json_encode($row));
        }

        // Saltamos si no hay referencia
        if (!isset($row[2]) || empty($row[2])) {
            return null;
        }

        // Saltamos cabeceras
        if (($row[0] ?? '') === 'ID' || ($row[1] ?? '') === 'F_COMPRA') {
            return null;
        }

        // Insertar
        DB::table('temp_import_inventario')->insert([
            'upload_id'  => $this->uploadId,
            'fc'         => $row[1] ?? null,
            'ref'        => $row[2] ?? null,
            'talla'      => (string) ($row[4] ?? ''),
            'ubicacion'  => $row[6] ?? null,
            'cantidad'   => (int) ($row[3] ?? 0),
            'p_costo'    => (int) ($row[5] ?? 0),
            'p_venta'    => (int) ($row[18] ?? $row[19] ?? $row[11] ?? 0),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function chunkSize(): int
    {
        return 2000;
    }
}
