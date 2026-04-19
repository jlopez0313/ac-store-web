<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Row;

class ChunkedRowImport implements OnEachRow, WithChunkReading
{
    public function __construct(private $callback)
    {
    }

    public function onRow(Row $row)
    {
        ($this->callback)($row->toArray(), $row->getIndex());
    }

    public function chunkSize(): int
    {
        return 1000;
    }
}
