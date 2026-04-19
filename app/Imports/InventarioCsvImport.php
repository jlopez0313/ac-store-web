<?php

namespace App\Imports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class InventarioCsvImport implements ToModel, WithChunkReading
{
    public function __construct(private string $uploadId)
    {
    }

    public function model(array $row)
    {
        // En CSV los índices suelen ser los mismos
        // Note: Con Maatwebsite Excel + CSV, el row[0] es la columna A.
        
        if (!isset($row[2]) || empty($row[2])) {
            return null;
        }

        // Saltamos cabeceras si se colaron
        if (($row[0] ?? '') === 'ID' || ($row[1] ?? '') === 'F_COMPRA') {
            return null;
        }

        return DB::table('temp_import_inventario')->insert([
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
        return 5000;
    }
}
