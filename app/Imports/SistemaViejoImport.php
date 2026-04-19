<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SistemaViejoImport implements WithMultipleSheets
{
    public function __construct(private array $sheetImports)
    {
    }

    public function sheets(): array
    {
        return $this->sheetImports;
    }
}
