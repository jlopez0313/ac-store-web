<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referencia;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ReferenciaFotoController extends Controller
{
    protected $imageService;

    public function __construct(ImageCompressionService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Recibe un chunk del archivo ZIP y lo ensambla.
     */
    public function uploadChunk(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'uploadId' => 'required|string|max:64',
            'chunkIndex' => 'required|integer|min:0',
            'totalChunks' => 'required|integer|min:1',
        ]);

        $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $request->uploadId);
        $chunkIndex = (int) $request->chunkIndex;
        $totalChunks = (int) $request->totalChunks;

        $chunkDir = storage_path("app/temp/chunks_photos/{$uploadId}");
        if (!is_dir($chunkDir)) {
            mkdir($chunkDir, 0755, true);
        }

        $request->file('file')->move($chunkDir, "chunk_{$chunkIndex}");

        $isLast = ($chunkIndex + 1) === $totalChunks;

        if ($isLast) {
            // Verificar que estén todos
            for ($i = 0; $i < $totalChunks; ++$i) {
                if (!file_exists("{$chunkDir}/chunk_{$i}")) {
                    return response()->json(['status' => 'waiting', 'missing' => $i]);
                }
            }

            // Ensamblar
            $finalPath = storage_path("app/temp/photos_{$uploadId}.zip");
            $out = fopen($finalPath, 'wb');
            for ($i = 0; $i < $totalChunks; ++$i) {
                $chunkFile = "{$chunkDir}/chunk_{$i}";
                fwrite($out, file_get_contents($chunkFile));
                unlink($chunkFile);
            }
            fclose($out);
            rmdir($chunkDir);

            return response()->json(['status' => 'complete', 'uploadId' => $uploadId]);
        }

        return response()->json(['status' => 'partial', 'received' => $chunkIndex + 1]);
    }

    /**
     * Procesa el archivo ZIP ya ensamblado.
     */
    public function processZip(Request $request)
    {
        $request->validate([
            'cuenta_id' => 'required|exists:cuentas,id',
            'uploadId' => 'required|string|max:64',
        ]);

        $cuenta_id = $request->cuenta_id;
        $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $request->uploadId);
        $zipPath = storage_path("app/temp/photos_{$uploadId}.zip");

        if (!file_exists($zipPath)) {
            return response()->json(['error' => 'Archivo ZIP no encontrado. ¿Se completó el upload?'], 422);
        }

        $zip = new ZipArchive();
        $res = $zip->open($zipPath);

        if ($res !== TRUE) {
            return response()->json(['error' => 'No se pudo abrir el archivo ZIP.'], 422);
        }

        $extractPath = storage_path('app/temp/extract_' . $uploadId);
        if (!file_exists($extractPath)) {
            mkdir($extractPath, 0777, true);
        }

        $zip->extractTo($extractPath);
        $zip->close();

        $files = $this->getFilesRecursive($extractPath);
        $summary = [
            'total' => count($files),
            'matched' => 0,
            'updated' => 0,
            'errors' => [],
            'skipped' => []
        ];

        foreach ($files as $filePath) {
            $filenameWithExt = basename($filePath);
            $filename = pathinfo($filenameWithExt, PATHINFO_FILENAME);
            $extension = strtolower(pathinfo($filenameWithExt, PATHINFO_EXTENSION));

            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                $summary['skipped'][] = "$filenameWithExt (formato no soportado)";
                continue;
            }

            $referencia = Referencia::where('cuenta_id', $cuenta_id)
                ->where('codigo', $filename)
                ->first();

            if (!$referencia) {
                $summary['skipped'][] = "$filename (referencia no encontrada)";
                continue;
            }

            $summary['matched']++;

            try {
                if ($referencia->foto && Storage::disk('public')->exists($referencia->foto)) {
                    Storage::disk('public')->delete($referencia->foto);
                }

                $savePath = 'referencias/' . $cuenta_id;
                $newPath = $this->imageService->compressImageFromPath($filePath, $savePath, $filename);

                if ($newPath) {
                    $referencia->update(['foto' => $newPath]);
                    $summary['updated']++;
                } else {
                    $summary['errors'][] = "Error procesando $filename";
                }
            } catch (\Exception $e) {
                $summary['errors'][] = "Error con $filename: " . $e->getMessage();
            }
        }

        // Limpiar archivos
        $this->deleteDirectory($extractPath);
        unlink($zipPath);

        return response()->json($summary);
    }

    private function getFilesRecursive($dir)
    {
        $results = [];
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                $results = array_merge($results, $this->getFilesRecursive($path));
            } else {
                if (strpos($file, '.') !== 0) {
                    $results[] = $path;
                }
            }
        }
        return $results;
    }

    private function deleteDirectory($dir)
    {
        if (!file_exists($dir)) return;
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            (is_dir("$dir/$file")) ? $this->deleteDirectory("$dir/$file") : unlink("$dir/$file");
        }
        return rmdir($dir);
    }
}
