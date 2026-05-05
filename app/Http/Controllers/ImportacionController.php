<?php

namespace App\Http\Controllers;

use App\Jobs\ImportarSistemaViejoJob;
use App\Models\Cuenta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ImportacionController extends Controller
{
    // ─────────────────────────────────────────────────────
    // PANTALLA
    // ─────────────────────────────────────────────────────
    public function index()
    {
        return Inertia::render('importacion/Index', [
            'cuentas' => Cuenta::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    // ─────────────────────────────────────────────────────
    // UPLOAD CHUNKED
    // Recibe un chunk y lo escribe en disco.
    // El cliente envía: file (blob), chunkIndex, totalChunks, uploadId
    // ─────────────────────────────────────────────────────
    public function chunk(Request $request): JsonResponse
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

        $chunkDir = storage_path("app/importacion/chunks/{$uploadId}");
        if (!is_dir($chunkDir)) {
            mkdir($chunkDir, 0755, true);
        }

        $request->file('file')->move($chunkDir, "chunk_{$chunkIndex}");

        // ¿Llegaron todos los chunks?
        // En lugar de glob, podemos simplemente contar si existen todos los archivos esperados
        // o esperar a que el cliente nos diga que es el último.

        $isLast = ($chunkIndex + 1) === $totalChunks;

        if ($isLast) {
            // Verificar que realmente están todos
            for ($i = 0; $i < $totalChunks; ++$i) {
                if (!file_exists("{$chunkDir}/chunk_{$i}")) {
                    return response()->json(['status' => 'waiting', 'missing' => $i]);
                }
            }

            // Ensamblar
            $finalPath = storage_path("app/importacion/{$uploadId}.xlsx");
            $out = fopen($finalPath, 'wb');
            for ($i = 0; $i < $totalChunks; ++$i) {
                $chunkFile = "{$chunkDir}/chunk_{$i}";
                fwrite($out, file_get_contents($chunkFile));
            }
            fclose($out);

            // Limpiar chunks
            array_map('unlink', glob("{$chunkDir}/chunk_*"));
            rmdir($chunkDir);

            return response()->json(['status' => 'complete', 'uploadId' => $uploadId]);
        }

        return response()->json(['status' => 'partial', 'received' => $chunkIndex + 1, 'total' => $totalChunks]);
    }

    // ─────────────────────────────────────────────────────
    // UPLOAD CSV INVENTARIO (chunked, igual que el Excel)
    // ─────────────────────────────────────────────────────
    public function chunkCsv(Request $request): JsonResponse
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

        $chunkDir = storage_path("app/importacion/chunks/{$uploadId}_csv");
        if (!is_dir($chunkDir)) {
            mkdir($chunkDir, 0755, true);
        }

        $request->file('file')->move($chunkDir, "chunk_{$chunkIndex}");

        $isLast = ($chunkIndex + 1) === $totalChunks;

        if ($isLast) {
            for ($i = 0; $i < $totalChunks; ++$i) {
                if (!file_exists("{$chunkDir}/chunk_{$i}")) {
                    return response()->json(['status' => 'waiting', 'missing' => $i]);
                }
            }

            $finalPath = storage_path("app/importacion/{$uploadId}_inventario.csv");
            $out = fopen($finalPath, 'wb');
            for ($i = 0; $i < $totalChunks; ++$i) {
                $chunkFile = "{$chunkDir}/chunk_{$i}";
                fwrite($out, file_get_contents($chunkFile));
            }
            fclose($out);

            array_map('unlink', glob("{$chunkDir}/chunk_*"));
            rmdir($chunkDir);

            return response()->json(['status' => 'complete', 'uploadId' => $uploadId]);
        }

        return response()->json(['status' => 'partial', 'received' => $chunkIndex + 1, 'total' => $totalChunks]);
    }

    // ─────────────────────────────────────────────────────
    // DISPARAR JOB
    // ─────────────────────────────────────────────────────
    public function ejecutar(Request $request): JsonResponse
    {
        $request->validate([
            'uploadId' => 'required|string|max:64',
            'cuenta_id' => 'required|exists:cuentas,id',
            'dry_run' => 'nullable|boolean',
            'solo' => 'nullable|string|max:200',
            'ref_desde' => 'nullable|string|max:50',
        ]);

        $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $request->uploadId);
        $solo = $request->input('solo', '');

        // Validar cada paso individual
        $pasosValidos = ['categorias', 'marcas', 'users_locales', 'proveedores', 'bodegas', 'referencias', 'inventario', 'traslados', 'compras', 'ventas', 'muestras'];
        if ($solo) {
            $pasosSolicitados = array_map('trim', explode(',', $solo));
            foreach ($pasosSolicitados as $p) {
                if (!in_array($p, $pasosValidos)) {
                    return response()->json(['error' => "Paso inválido: {$p}"], 422);
                }
            }
        }

        $filePath = storage_path("app/importacion/{$uploadId}.xlsx");

        // CSV de inventario (opcional — si no se subió, el Job lo genera del Excel)
        $csvFilePath = '';
        $csvPath = storage_path("app/importacion/{$uploadId}_inventario.csv");
        if (file_exists($csvPath)) {
            $csvFilePath = $csvPath;
        }

        // El Excel solo es necesario si se importa algo distinto de solo inventario
        $soloInventario = $solo === 'inventario';
        $necesitaExcel = !$soloInventario || !$csvFilePath;

        if ($necesitaExcel && !file_exists($filePath)) {
            return response()->json(['error' => 'Archivo Excel no encontrado. ¿Se completó el upload?'], 422);
        }

        $jobKey = 'importacion_' . $uploadId;

        // Estado inicial en cache
        Cache::put($jobKey, [
            'paso' => 'encolado',
            'pct' => 0,
            'mensaje' => 'Job encolado, esperando worker...',
            'dry_run' => $request->boolean('dry_run'),
            'logs' => [],
            'ts' => now()->toDateTimeString(),
        ], now()->addHours(2));

        ImportarSistemaViejoJob::dispatch(
            filePath: file_exists($filePath) ? $filePath : '',
            cuentaId: (int) $request->cuenta_id,
            dryRun: $request->boolean('dry_run'),
            soloStep: $solo,
            jobKey: $jobKey,
            userId: (int) auth()->id(),
            csvFilePath: $csvFilePath,
            refDesde: trim((string) $request->input('ref_desde', '')),
        )->onQueue('importacion');

        return response()->json(['jobKey' => $jobKey]);
    }

    // ─────────────────────────────────────────────────────
    // PROGRESO (polling)
    // ─────────────────────────────────────────────────────
    public function progreso(Request $request): JsonResponse
    {
        $jobKey = $request->input('jobKey');
        if (!$jobKey) {
            return response()->json(['error' => 'jobKey requerido'], 422);
        }

        $data = Cache::get($jobKey);
        if (!$data) {
            return response()->json(['paso' => 'no_encontrado', 'pct' => 0, 'mensaje' => 'Job no encontrado o expirado.']);
        }

        return response()->json($data);
    }
}