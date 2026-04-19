<?php

namespace App\Helpers;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Settings;

class ExcelToCsvConverter
{
    /**
     * Convierte una hoja de un Excel a CSV en una sola pasada (1 apertura del archivo).
     */
    public static function convert(string $inputPath, string $outputPath, string $sheetName): bool
    {
        if (!file_exists($inputPath)) {
            return false;
        }

        // Forzar caché en memoria (evita BatchCache de Maatwebsite → MySQL)
        Settings::setCache(null);

        $reader = IOFactory::createReaderForFile($inputPath);
        $reader->setReadDataOnly(true);
        $reader->setLoadSheetsOnly([$sheetName]);

        $spreadsheet = $reader->load($inputPath);
        $sheet = $spreadsheet->getActiveSheet();

        if ($sheet->getHighestRow() <= 0) {
            $spreadsheet->disconnectWorksheets();

            return false;
        }

        $file = fopen($outputPath, 'w');

        foreach ($sheet->getRowIterator() as $rowObj) {
            $cellIterator = $rowObj->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);
            $rowData = [];
            foreach ($cellIterator as $cell) {
                $rowData[] = $cell->getValue();
            }
            if (array_filter($rowData)) {
                fputcsv($file, $rowData);
            }
        }

        fclose($file);
        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);
        gc_collect_cycles();

        return true;
    }
}
