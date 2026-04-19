<?php

namespace App\Jobs;

use App\Helpers\ExcelToCsvConverter;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Settings;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class ImportarSistemaViejoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 3600;
    public int $tries = 1;

    private array $mapMarcas = [];
    private array $mapUsers = [];       // Nit_Cedula → user_id
    private array $mapLocales = [];     // Orden_de_ingreso → user_id
    private array $mapProveedores = [];
    private array $mapBodegas = [];
    private array $mapEstanterias = [];
    private array $mapReferencias = [];
    private array $mapCompras = [];
    private array $mapVentas = [];
    private string $csvInventarioPath = '';
    private array $sheetsCache = [];

    private int $rolLocalId = 0;
    private int $userPorDefecto = 1;

    public function __construct(
        private readonly string $filePath,
        private readonly int $cuentaId,
        private readonly bool $dryRun,
        private readonly string $soloStep,
        private readonly string $jobKey,
        private readonly string $csvFilePath = '',
        private readonly string $refDesde = '',
    ) {
    }

    // ─────────────────────────────────────────────────────
    // ENTRY POINT
    // ─────────────────────────────────────────────────────
    public function handle(): void
    {
        ini_set('memory_limit', '2048M');

        $this->log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->log('INICIO importación cuenta=' . $this->cuentaId . ($this->dryRun ? ' [DRY-RUN]' : ''));
        $this->log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Determinar pasos activos (soloStep puede ser comma-separated)
        $stepsActivos = $this->soloStep ? array_map('trim', explode(',', $this->soloStep)) : [];
        $soloInventario = $stepsActivos === ['inventario'];

        // El Excel es necesario salvo que solo se importe inventario con CSV propio
        $necesitaExcel = !$soloInventario || !$this->csvFilePath;
        if ($necesitaExcel && !file_exists($this->filePath)) {
            $this->log('ERROR: archivo no encontrado: ' . $this->filePath);

            return;
        }

        $this->resolverRolLocal();
        $this->userPorDefecto = $this->obtenerUserPorDefecto();

        if ($necesitaExcel) {
            $this->preloadSheets();
        }

        $pasos = [
            'categorias' => fn() => $this->importarCategorias(),
            'marcas' => fn() => $this->importarMarcas(),
            'users_locales' => fn() => $this->importarUsersLocales(),
            'proveedores' => fn() => $this->importarProveedores(),
            'bodegas' => fn() => $this->importarBodegas(),
            'referencias' => fn() => $this->importarReferencias(),
            'inventario' => fn() => $this->importarInventario(),
            'traslados' => fn() => $this->importarTraslados(),
            'compras' => fn() => $this->importarCompras(),
            'ventas' => fn() => $this->importarVentas(),
            'muestras' => fn() => $this->importarMuestras(),
        ];

        $totalPasos = count($pasos);
        $pasoActual = 0;

        foreach ($pasos as $nombre => $fn) {
            if ($stepsActivos && !in_array($nombre, $stepsActivos)) {
                ++$pasoActual;
                continue;
            }

            ++$pasoActual;
            $pct = round(($pasoActual / $totalPasos) * 100);

            $this->log("─── INICIO: {$nombre} ───");
            $this->reportProgress($nombre, $pct, "Procesando {$nombre}...");
            $inicio = microtime(true);

            try {
                $fn();
            } catch (\Throwable $e) {
                $this->log("ERROR en {$nombre}: " . $e->getMessage());
            }

            $seg = round(microtime(true) - $inicio, 1);
            $this->log("─── FIN: {$nombre} ({$seg}s) ───");
        }

        if (file_exists($this->filePath)) {
            @unlink($this->filePath);
        }

        // Solo borrar CSV generado desde Excel, NO el subido por el usuario
        if ($this->csvInventarioPath && $this->csvInventarioPath !== $this->csvFilePath && file_exists($this->csvInventarioPath)) {
            @unlink($this->csvInventarioPath);
        }

        $this->reportProgress('completado', 100, $this->dryRun ? 'SIMULACIÓN COMPLETADA' : 'IMPORTACIÓN COMPLETADA ✓');
        $this->log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->log($this->dryRun ? 'SIMULACIÓN COMPLETADA' : 'IMPORTACIÓN COMPLETADA ✓');
        $this->log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    private function loadSheet(string $sheetName)
    {
        if (isset($this->sheetsCache[$sheetName])) {
            return $this->sheetsCache[$sheetName];
        }

        // Fallback: carga individual (no debería llegar aquí tras preloadSheets)
        return collect();
    }

    private function preloadSheets(): void
    {
        $sheetNames = [
            'GENEROS',
            'TALLAS CURVAS',
            'MARCAS',
            'USUARIOS',
            'UBICACION_CALZADO',
            'ESTANTES X BODEGA',
            'REFERENCIAS',
            'TRASLADOS',
            'FACTURAS_COMPRAS',
            'FACTURAS_VENTAS',
            'LOCALES',
            'TIPO_UBICACION',
        ];

        $this->log('Precargando todas las hojas con PhpSpreadsheet (1 apertura)...');

        // Usar caché en memoria para evitar BatchCache de Maatwebsite (explota MySQL con too many placeholders)
        Settings::setCache(null);

        $reader = IOFactory::createReaderForFile($this->filePath);
        $reader->setReadDataOnly(true);

        // Solo cargar las hojas que necesitamos (excluir INVENTARIO que va por CSV)
        $reader->setLoadSheetsOnly($sheetNames);
        $spreadsheet = $reader->load($this->filePath);

        foreach ($sheetNames as $name) {
            try {
                $sheet = $spreadsheet->getSheetByName($name);
                if ($sheet) {
                    $data = $sheet->toArray(null, true, true, false);
                    $this->sheetsCache[$name] = collect(array_map(fn($row) => collect($row), $data));
                } else {
                    $this->sheetsCache[$name] = collect();
                }
            } catch (\Throwable) {
                $this->sheetsCache[$name] = collect();
            }
        }

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);
        gc_collect_cycles();

        $loaded = array_keys(array_filter($this->sheetsCache, fn($c) => $c->isNotEmpty()));
        $this->log('Pre-carga completada: ' . implode(', ', $loaded));
    }

    public function failed(\Throwable $e): void
    {
        $this->reportProgress('error', 0, 'ERROR CRÍTICO: ' . $e->getMessage());
        $this->log('JOB FALLIDO: ' . $e->getMessage());
        if (file_exists($this->filePath)) {
            @unlink($this->filePath);
        }
    }

    // ─────────────────────────────────────────────────────
    // LOG — escribe al canal 'importacion' (storage/logs/importacion.log)
    // ─────────────────────────────────────────────────────
    private function log(string $msg): void
    {
        Log::channel('importacion')->info($msg);

        // También agregar al log del cache para ver en tiempo real
        if ($this->jobKey) {
            $data = Cache::get($this->jobKey) ?: [];
            $logs = $data['logs'] ?? [];
            $logs[] = $msg;
            if (count($logs) > 50) {
                array_shift($logs);
            } // Mantener últimos 50 logs
            $data['logs'] = $logs;
            Cache::put($this->jobKey, $data, now()->addHours(2));
        }
    }

    private function reportProgress(string $paso, int $pct, string $mensaje): void
    {
        if (!$this->jobKey) {
            return;
        }

        $data = Cache::get($this->jobKey) ?: [
            'logs' => [],
            'dry_run' => $this->dryRun,
        ];

        $data['paso'] = $paso;
        $data['pct'] = $pct;
        $data['mensaje'] = $mensaje;
        $data['ts'] = now()->toDateTimeString();

        Cache::put($this->jobKey, $data, now()->addHours(2));
    }

    // ─────────────────────────────────────────────────────
    // 1. CATEGORÍAS
    // ─────────────────────────────────────────────────────
    private function importarCategorias(): void
    {
        $wsGeneros = $this->loadSheet('GENEROS');
        $wsTallas = $this->loadSheet('TALLAS CURVAS');

        if ($wsGeneros->isEmpty() || $wsTallas->isEmpty()) {
            $this->log('  Hojas GENEROS/TALLAS CURVAS no encontradas o vacías — usando CALZADO por defecto');
            $this->crearCategoria('CALZADO', ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], 'CAL');

            return;
        }

        $generos = [];
        foreach ($wsGeneros as $i => $row) {
            if ($i === 0 || !($row[0] ?? null)) {
                continue;
            }
            $generos[(int) $row[0]] = strtoupper(trim($row[1]));
        }

        $tallasPorGenero = [];
        foreach ($wsTallas as $i => $row) {
            if ($i === 0 || !($row[0] ?? null)) {
                continue;
            }
            [, $idGenero, $talla] = array_pad($row->toArray(), 3, null);
            if (!$idGenero || !$talla) {
                continue;
            }
            $t = trim((string) $talla);
            if (in_array($t, ['U', 'C', ''], true)) {
                continue;
            }
            $tallasPorGenero[(int) $idGenero][] = $t;
        }

        foreach ($tallasPorGenero as $idGenero => $tallas) {
            $nombre = $generos[$idGenero] ?? "GENERO_{$idGenero}";
            $prefijo = substr(preg_replace('/[^A-Z]/', '', $nombre), 0, 3) ?: 'CAL';
            $id = $this->crearCategoria($nombre, array_values(array_unique($tallas)), $prefijo);
            $this->log("  Categoría '{$nombre}' id={$id} — tallas: " . implode(', ', $tallas));
        }
    }

    private function crearCategoria(string $nombre, array $tallas, string $prefijo): int
    {
        if ($this->dryRun) {
            return 1;
        }
        $existing = DB::table('categorias')->where('nombre', $nombre)->first();
        if ($existing) {
            $this->log("  Categoría '{$nombre}' ya existe (id={$existing->id})");

            return (int) $existing->id;
        }

        return DB::table('categorias')->insertGetId([
            'nombre' => $nombre,
            'tipo_control' => 'tallas',
            'subdivision_stock' => json_encode(['Izquierdo', 'Derecho']),
            'variaciones_json' => json_encode(array_values($tallas)),
            'prefijo_sku' => $prefijo,
            'creado_por' => $this->userPorDefecto ?: null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────
    // 2. MARCAS
    // ─────────────────────────────────────────────────────
    private function importarMarcas(): void
    {
        $rows = $this->loadSheet('MARCAS');
        if ($rows->isEmpty()) {
            $this->log('  Hoja MARCAS no encontrada o vacía');

            return;
        }

        $insertados = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [$idViejo, $nombre] = array_pad($row->toArray(), 2, null);
            if (!$idViejo || !$nombre) {
                continue;
            }
            $nombre = strtoupper(trim($nombre));

            if (!$this->dryRun) {
                $existing = DB::table('marcas')
                    ->where('nombre', $nombre)
                    ->where(function ($q) {
                        $q->where('cuenta_id', $this->cuentaId)->orWhereNull('cuenta_id');
                    })->first();

                $this->mapMarcas[$idViejo] = $existing
                    ? $existing->id
                    : DB::table('marcas')->insertGetId([
                        'nombre' => $nombre,
                        'cuenta_id' => $this->cuentaId,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                if (!$existing) {
                    ++$insertados;
                }
            } else {
                $this->mapMarcas[$idViejo] = 9000 + (int) $idViejo;
                ++$insertados;
            }
        }

        $this->log("  {$insertados} insertadas / " . count($this->mapMarcas) . ' mapeadas');
    }

    // ─────────────────────────────────────────────────────
    // 3. USERS LOCALES (tipo 1 y 2)
    // ─────────────────────────────────────────────────────
    private function importarUsersLocales(): void
    {
        $rows = $this->loadSheet('USUARIOS');
        if ($rows->isEmpty()) {
            $this->log('  Hoja USUARIOS no encontrada o vacía');

            return;
        }

        $insertados = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [$nombre, $nit, , , $email, , $tipo, $orden] = array_pad($row->toArray(), 8, null);
            // Solo tipo 1 = vendedores/locales. Tipo 2 = proveedores (van en importarProveedores)
            if (!$nombre || (int) $tipo !== 1) {
                continue;
            }

            $nombre = strtoupper(trim($nombre));
            $nit = trim((string) $nit);
            $username = preg_replace('/[^a-z0-9]/', '_', strtolower($nombre));
            $emailUso = $email ?: ($username . '@sistema.local');

            if (!$this->dryRun) {
                $existing = DB::table('users')
                    ->where('cuenta_id', $this->cuentaId)
                    ->where('username', $username)
                    ->first();

                if ($existing) {
                    $this->mapUsers[$nit] = $existing->id;
                    if ($orden !== null) {
                        $this->mapLocales[(int) $orden] = $existing->id;
                    }
                    continue;
                }

                $usernameUnico = $username;
                $suffix = 1;
                while (DB::table('users')->where('username', $usernameUnico)->exists()) {
                    $usernameUnico = $username . '_' . $suffix++;
                }

                $userId = DB::table('users')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'name' => $nombre,
                    'username' => $usernameUnico,
                    'documento' => $nit,
                    'email' => $emailUso,
                    'password' => Hash::make($nit ?: 'cambiar123'),
                    'estado' => 1,
                    'precio_suscripcion' => config('constants.suscripciones.default_user_price'),
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if ($this->rolLocalId) {
                    DB::table('model_has_roles')->insertOrIgnore([
                        'role_id' => $this->rolLocalId,
                        'model_type' => 'App\\Models\\User',
                        'model_id' => $userId,
                    ]);
                }

                $this->mapUsers[$nit] = $userId;
                if ($orden !== null) {
                    $this->mapLocales[(int) $orden] = $userId;
                }
                ++$insertados;
            } else {
                $fakeId = 50000 + $insertados;
                $this->mapUsers[$nit] = $fakeId;
                if ($orden !== null) {
                    $this->mapLocales[(int) $orden] = $fakeId;
                }
                ++$insertados;
            }
        }

        $this->log("  {$insertados} users creados / " . count($this->mapUsers) . ' mapeados');
        if ($insertados > 0 && !$this->dryRun) {
            $this->log('  ⚠ Password inicial = Nit/Cédula del usuario');
        }
    }

    // ─────────────────────────────────────────────────────
    // 4. PROVEEDORES (tipo 3)
    // ─────────────────────────────────────────────────────
    private function importarProveedores(): void
    {
        $rows = $this->loadSheet('USUARIOS');
        if ($rows->isEmpty()) {
            return;
        }

        $insertados = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [$nombre, $nit, $telefono, , $email, , $tipo] = array_pad($row->toArray(), 7, null);
            // En este sistema los proveedores son tipo 2 (no existe tipo 3)
            if (!$nombre || (int) $tipo !== 2) {
                continue;
            }

            $nombre = strtoupper(trim($nombre));
            $nit = trim((string) $nit);

            if (!$this->dryRun) {
                $existing = DB::table('proveedores')
                    ->where('documento', $nit ?: '000000')
                    ->where('cuenta_id', $this->cuentaId)
                    ->first();

                $this->mapProveedores[$nit] = $existing
                    ? $existing->id
                    : DB::table('proveedores')->insertGetId([
                        'cuenta_id' => $this->cuentaId,
                        'nombre' => $nombre,
                        'tipo_documento' => 'NIT',
                        'documento' => $nit ?: '000000',
                        'telefono' => $telefono,
                        'correo' => $email,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                if (!$existing) {
                    ++$insertados;
                }
            } else {
                $this->mapProveedores[$nit] = 60000 + $insertados;
                ++$insertados;
            }
        }

        $this->log("  {$insertados} insertados / " . count($this->mapProveedores) . ' mapeados');
    }

    // ─────────────────────────────────────────────────────
    // 5. BODEGAS + ESTANTERÍAS
    // ─────────────────────────────────────────────────────
    private function importarBodegas(): void
    {
        $rows = $this->loadSheet('UBICACION_CALZADO');
        if ($rows->isEmpty()) {
            $this->log('  Hoja UBICACION_CALZADO no encontrada o vacía');

            return;
        }

        $insertadosBodegas = $insertadosEst = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [$idViejo, $nombre, , $activo] = array_pad($row->toArray(), 4, null);
            if (!$idViejo || !$nombre || (int) $idViejo === 0) {
                continue;
            }
            $nombre = strtoupper(trim($nombre));

            if (!$this->dryRun) {
                $existing = DB::table('bodegas')
                    ->where('nombre', $nombre)
                    ->where('cuenta_id', $this->cuentaId)->first();

                $bodegaId = $existing ? $existing->id : DB::table('bodegas')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'nombre' => $nombre,
                    'estado' => $activo ? 1 : 0,
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                if (!$existing) {
                    ++$insertadosBodegas;
                }
                $this->mapBodegas[$idViejo] = $bodegaId;

                $estExisting = DB::table('estanterias')
                    ->where('bodega_id', $bodegaId)->where('nombre', 'GENERAL')->first();
                $estId = $estExisting ? $estExisting->id : DB::table('estanterias')->insertGetId([
                    'bodega_id' => $bodegaId,
                    'nombre' => 'GENERAL',
                    'estado' => 1,
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                if (!$estExisting) {
                    ++$insertadosEst;
                }
                $this->mapEstanterias[$idViejo] = $estId;
            } else {
                $this->mapBodegas[$idViejo] = 9000 + (int) $idViejo;
                $this->mapEstanterias[$idViejo] = 8000 + (int) $idViejo;
                ++$insertadosBodegas;
            }
        }

        $this->log("  {$insertadosBodegas} bodegas / {$insertadosEst} estanterías GENERAL creadas");

        // Persistir mapa idViejo→nombre para futuros imports sin Excel
        $this->guardarMapaBodegas();

        $this->importarEstantesReales();
    }

    private function importarEstantesReales(): void
    {
        $rows = $this->loadSheet('ESTANTES X BODEGA');
        if ($rows->isEmpty()) {
            return;
        }

        $creados = [];
        $count = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [, $bodegaVieja, $estante] = array_pad($row->toArray(), 3, null);
            if (!$bodegaVieja || !$estante) {
                continue;
            }
            $key = "{$bodegaVieja}_{$estante}";
            if (isset($creados[$key])) {
                continue;
            }

            $bodegaId = $this->mapBodegas[$bodegaVieja] ?? null;
            if (!$bodegaId) {
                continue;
            }

            $nombre = 'ESTANTE ' . strtoupper(trim((string) $estante));
            if (
                !$this->dryRun && !DB::table('estanterias')
                    ->where('bodega_id', $bodegaId)->where('nombre', $nombre)->exists()
            ) {
                DB::table('estanterias')->insert([
                    'bodega_id' => $bodegaId,
                    'nombre' => $nombre,
                    'estado' => 1,
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                ++$count;
            }
            $creados[$key] = true;
        }

        if ($count > 0) {
            $this->log("  {$count} estantes detallados creados");
        }
    }

    // ─────────────────────────────────────────────────────
    // 6. REFERENCIAS
    // ─────────────────────────────────────────────────────
    private function importarReferencias(): void
    {
        $categorias = DB::table('categorias')->pluck('id', 'nombre')->toArray();
        $categoriaDefault = array_values($categorias)[0] ?? 1;
        $generoCatMap = [];

        $wsGeneros = $this->loadSheet('GENEROS');
        if ($wsGeneros->isNotEmpty()) {
            foreach ($wsGeneros as $i => $row) {
                if ($i === 0 || !($row[0] ?? null)) {
                    continue;
                }
                $nombre = strtoupper(trim($row[1]));
                if (isset($categorias[$nombre])) {
                    $generoCatMap[(int) $row[0]] = $categorias[$nombre];
                }
            }
        }

        $rows = $this->loadSheet('REFERENCIAS');
        if ($rows->isEmpty()) {
            $this->log('  Hoja REFERENCIAS no encontrada o vacía');

            return;
        }

        $insertados = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            $rowArr = $row->toArray();
            $refVieja = $rowArr[0] ?? null;
            $descripcion = $rowArr[2] ?? null;
            if (!$refVieja || !$descripcion) {
                continue;
            }

            $codigo = str_pad((string) (int) $refVieja, 6, '0', STR_PAD_LEFT);
            $descripcion = strtoupper(trim($descripcion));
            $marcaId = $this->mapMarcas[$rowArr[1] ?? null] ?? null;
            $catId = $generoCatMap[(int) ($rowArr[4] ?? 0)] ?? $categoriaDefault;

            if (!$this->dryRun) {
                $existing = DB::table('referencias')
                    ->where('codigo', $codigo)->where('cuenta_id', $this->cuentaId)->first();
                if ($existing) {
                    $this->mapReferencias[$refVieja] = $existing->id;
                } else {
                    $this->mapReferencias[$refVieja] = DB::table('referencias')->insertGetId([
                        'codigo' => $codigo,
                        'descripcion' => $descripcion,
                        'categoria_id' => $catId,
                        'marca_id' => $marcaId,
                        'cuenta_id' => $this->cuentaId,
                        'sistema_viejo' => true,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    ++$insertados;
                }
            } else {
                $this->mapReferencias[$refVieja] = 70000 + (int) $refVieja;
                ++$insertados;
            }
        }

        $this->log("  {$insertados} insertadas / " . count($this->mapReferencias) . ' mapeadas');
    }

    // ─────────────────────────────────────────────────────
    // 7. INVENTARIO (optimizado: agrega en memoria, sin tabla temporal)
    // ─────────────────────────────────────────────────────
    private function importarInventario(): void
    {
        // Pre-cargar mapas si están vacíos (ej: corriendo inventario sin maestros)
        $this->ensureMaps();

        $csvPath = $this->ensureCsvInventario();
        if (!$csvPath) {
            $this->log('  ERROR: No se pudo generar CSV de la hoja INVENTARIO.');

            return;
        }

        $this->log('  Paso 1: Leyendo CSV y agregando en memoria por ref/talla/ubicación...');

        if ($this->refDesde !== '') {
            $this->log("  ⚠ Filtrando: solo referencias >= {$this->refDesde}");
        }

        $agrupados = [];
        $rowCount = 0;
        $omitidosPorFiltro = 0;
        $handle = fopen($csvPath, 'r');

        // Auto-detectar delimitador leyendo la primera línea
        $firstLine = fgets($handle);
        rewind($handle);
        $delimiter = ',';
        if ($firstLine) {
            $semicolons = substr_count($firstLine, ';');
            $commas = substr_count($firstLine, ',');
            if ($semicolons > $commas) {
                $delimiter = ';';
            }
            $this->log("  Delimitador detectado: '{$delimiter}' (;={$semicolons} ,={$commas})");
        }

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            ++$rowCount;

            // Saltar cabecera
            if ($rowCount === 1 && (($row[0] ?? '') === 'ID' || ($row[1] ?? '') === 'F_COMPRA' || ($row[0] ?? '') === 'Cod')) {
                continue;
            }

            // Log primeras filas para diagnóstico
            if ($rowCount <= 3) {
                $preview = array_map(fn($v) => mb_substr((string) $v, 0, 20), array_slice($row, 0, 10));
                $this->log("  Fila {$rowCount} (" . count($row) . ' cols): ' . implode(' | ', $preview));
            }

            // Filtrar: solo ingresos disponibles
            // [7] Movimiento=1, [10] Factura_venta=vacío, [20] Cancelado=vacío/false/0
            if ((int) ($row[7] ?? 0) !== 1) {
                continue;
            }
            if (!empty($row[10])) {
                continue;
            }  // ya vendido
            $cancelado = strtolower(trim((string) ($row[20] ?? '')));
            if ($cancelado === '1' || $cancelado === 'true') {
                continue;
            }

            if (!isset($row[2]) || $row[2] === '') {
                continue;
            }

            // Filtrar por referencia de inicio si se especificó
            if ($this->refDesde !== '' && (int) $row[2] < (int) $this->refDesde) {
                ++$omitidosPorFiltro;
                continue;
            }

            $ref = $row[2];
            $rawTalla = (string) ($row[4] ?? '');
            $talla = mb_check_encoding($rawTalla, 'UTF-8') ? $rawTalla : mb_convert_encoding($rawTalla, 'UTF-8', 'Windows-1252');
            $talla = trim($talla);
            $ubicacion = $row[6] ?? '';
            $cantidad = (int) ($row[3] ?? 0);
            $pCosto = (int) ($row[5] ?? 0);
            $pVenta = (int) ($row[18] ?? $row[19] ?? $row[11] ?? 0);

            $key = "{$ref}|{$talla}|{$ubicacion}";

            if (!isset($agrupados[$key])) {
                $agrupados[$key] = [
                    'ref' => $ref,
                    'talla' => $talla,
                    'ubicacion' => $ubicacion,
                    'stock_total' => 0,
                    'costo' => $pCosto,
                    'venta' => $pVenta,
                ];
            } else {
                if ($pCosto < $agrupados[$key]['costo']) {
                    $agrupados[$key]['costo'] = $pCosto;
                }
                if ($pVenta < $agrupados[$key]['venta']) {
                    $agrupados[$key]['venta'] = $pVenta;
                }
            }

            $agrupados[$key]['stock_total'] += $cantidad;

            if ($rowCount % 50000 === 0) {
                $this->log("    > {$rowCount} filas procesadas...");
            }
        }

        fclose($handle);

        $grupos = count($agrupados);
        $this->log("  {$rowCount} filas leídas → {$grupos} grupos únicos");

        if ($omitidosPorFiltro > 0) {
            $this->log("  ({$omitidosPorFiltro} filas omitidas por filtro ref >= {$this->refDesde})");
        }

        if ($this->dryRun) {
            $this->log('  [DRY-RUN] Omitiendo inserción en tablas de producción');

            return;
        }

        $this->log('  Paso 2: Insertando inventario consolidado...');

        // Pre-fetch inventarios existentes para evitar N queries individuales
        $existingMap = [];
        DB::table('inventarios')
            ->where('cuenta_id', $this->cuentaId)
            ->select('id', 'referencia_id', 'estanteria_id', 'talla', 'stock')
            ->orderBy('id')
            ->chunk(5000, function ($rows) use (&$existingMap) {
                foreach ($rows as $r) {
                    $existingMap["{$r->referencia_id}|{$r->estanteria_id}|{$r->talla}"] = $r;
                }
            });

        $insertados = $actualizados = $omitidos = 0;
        $batch = [];
        $sub = json_encode(['Izquierdo' => 0, 'Derecho' => 0]);
        $now = now();

        DB::beginTransaction();
        try {
            foreach ($agrupados as $item) {
                $refId = $this->mapReferencias[$item['ref']] ?? null;
                $estId = $this->mapEstanterias[$item['ubicacion']] ?? null;

                if (!$refId || !$estId || $item['stock_total'] <= 0) {
                    ++$omitidos;
                    continue;
                }

                $existing = $existingMap["{$refId}|{$estId}|{$item['talla']}"] ?? null;

                if ($existing) {
                    DB::table('inventarios')->where('id', $existing->id)->update([
                        'stock' => $existing->stock + $item['stock_total'],
                        'updated_at' => $now,
                    ]);
                    ++$actualizados;
                } else {
                    $batch[] = [
                        'cuenta_id' => $this->cuentaId,
                        'referencia_id' => $refId,
                        'estanteria_id' => $estId,
                        'talla' => $item['talla'],
                        'stock' => $item['stock_total'],
                        'subdivision_stock' => $sub,
                        'precio_compra' => $item['costo'],
                        'precio_venta' => $item['venta'],
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if (count($batch) >= 500) {
                        DB::table('inventarios')->insert($batch);
                        $insertados += count($batch);
                        $batch = [];
                    }
                }
            }

            if (!empty($batch)) {
                DB::table('inventarios')->insert($batch);
                $insertados += count($batch);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->log("  Inventario sincronizado: {$insertados} nuevos | {$actualizados} actualizados | {$omitidos} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // 8. TRASLADOS
    // ─────────────────────────────────────────────────────
    private function importarTraslados(): void
    {
        $rows = $this->loadSheet('TRASLADOS');
        if ($rows->isEmpty()) {
            $this->log('  Hoja TRASLADOS no encontrada o vacía');

            return;
        }

        $insertados = $omitidos = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            $rowArr = $row->toArray();
            [, $fecha, , $refVieja, $cantidad, $talla, $origen, $destino] = array_pad($rowArr, 8, null);
            if (!$refVieja || !$origen || !$destino) {
                continue;
            }

            $refId = $this->mapReferencias[$refVieja] ?? null;
            $bodOrigen = $this->mapBodegas[$origen] ?? null;
            $bodDest = $this->mapBodegas[$destino] ?? null;

            if (!$refId || !$bodOrigen || !$bodDest) {
                ++$omitidos;
                continue;
            }

            if (!$this->dryRun) {
                DB::table('traslados')->insert([
                    'cuenta_id' => $this->cuentaId,
                    'referencia_id' => $refId,
                    'talla' => trim((string) $talla),
                    'bodega_origen_id' => $bodOrigen,
                    'estanteria_origen_id' => $this->mapEstanterias[$origen] ?? null,
                    'bodega_destino_id' => $bodDest,
                    'estanteria_destino_id' => $this->mapEstanterias[$destino] ?? null,
                    'cantidad' => (int) $cantidad,
                    'user_id' => $this->userPorDefecto,
                    'created_at' => $this->parsearFecha($fecha) ?? now(),
                    'updated_at' => now(),
                ]);
            }
            ++$insertados;
        }

        $this->log("  {$insertados} insertados | {$omitidos} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // 9. COMPRAS + DETALLES
    // ─────────────────────────────────────────────────────
    private function importarCompras(): void
    {
        $rows = $this->loadSheet('FACTURAS_COMPRAS');
        if ($rows->isEmpty()) {
            $this->log('  Hoja FACTURAS_COMPRAS no encontrada o vacía');

            return;
        }

        $insertados = $omitidos = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [$idViejo, $fecha, , $provNit, $obs, $cerrada] = array_pad($row->toArray(), 6, null);
            if (!$idViejo) {
                continue;
            }

            $provNit = trim((string) $provNit);
            $provId = $this->mapProveedores[$provNit] ?? $this->crearProveedorGenerico($provNit);

            if (!$provId) {
                ++$omitidos;
                continue;
            }

            if (!$this->dryRun) {
                $this->mapCompras[$idViejo] = DB::table('compras')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'proveedor_id' => $provId,
                    'estado' => $cerrada ? 'cerrada' : 'abierta',
                    'fecha_apertura' => $this->parsearFecha($fecha) ?? now()->toDateTimeString(),
                    'fecha_cierre' => $cerrada ? ($this->parsearFecha($fecha) ?? now()->toDateTimeString()) : null,
                    'flete' => 0,
                    'observaciones' => $obs,
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $this->mapCompras[$idViejo] = 80000 + (int) $idViejo;
            }
            ++$insertados;
        }

        $this->log("  {$insertados} cabeceras | {$omitidos} sin proveedor");
        $this->log('  Leyendo detalles de compra desde INVENTARIO...');

        $agrupado = [];
        $this->iterarCsvInventario(function ($row, $index) use (&$agrupado) {
            if ($index === 1) {
                return;
            }

            if ((int) ($row[7] ?? 0) !== 1) {
                return;
            }
            $fc = $row[1] ?? null;
            $ref = $row[2] ?? null;
            if (!$fc || !$ref) {
                return;
            }

            $talla = trim((string) ($row[4] ?? ''));
            $key = "{$fc}_{$ref}_{$talla}";
            if (!isset($agrupado[$key])) {
                $agrupado[$key] = [
                    'compraVieja' => $fc,
                    'refVieja' => $ref,
                    'talla' => $talla,
                    'ubicacion' => $row[6] ?? null,
                    'cantidad' => 0,
                    'p_costo' => (int) ($row[5] ?: 0),
                    'p_venta' => (int) ($row[18] ?: $row[19] ?: $row[11] ?: 0),
                ];
            }
            $agrupado[$key]['cantidad'] += (int) ($row[3] ?? 1);
        });

        $di = $do = 0;
        $batch = [];
        $now = now();

        DB::beginTransaction();
        try {
            foreach ($agrupado as $item) {
                $compraId = $this->mapCompras[$item['compraVieja']] ?? null;
                $refId = $this->mapReferencias[$item['refVieja']] ?? null;
                $bodegaId = $this->mapBodegas[$item['ubicacion']] ?? null;
                if (!$compraId || !$refId || !$bodegaId) {
                    ++$do;
                    continue;
                }

                if (!$this->dryRun) {
                    $batch[] = [
                        'compra_id' => $compraId,
                        'referencia_id' => $refId,
                        'bodega_id' => $bodegaId,
                        'modo' => 'unidades',
                        'cantidad' => $item['cantidad'],
                        'precio_unitario' => $item['p_costo'],
                        'precio_venta' => $item['p_venta'],
                        'subtotal' => $item['cantidad'] * $item['p_costo'],
                        'tallas' => json_encode([$item['talla'] => $item['cantidad']]),
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if (count($batch) >= 500) {
                        DB::table('compra_detalles')->insert($batch);
                        $batch = [];
                    }
                }
                ++$di;
            }

            if (!empty($batch)) {
                DB::table('compra_detalles')->insert($batch);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->log("  Detalles: {$di} insertados | {$do} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // 10. VENTAS + DETALLES
    // ─────────────────────────────────────────────────────
    private function importarVentas(): void
    {
        // Reconstruir mapLocales desde hoja LOCALES (Id_Ubicacion → userId)
        $this->buildMapLocalesFromSheet();

        $rows = $this->loadSheet('FACTURAS_VENTAS');
        if ($rows->isEmpty()) {
            $this->log('  Hoja FACTURAS_VENTAS no encontrada o vacía');

            return;
        }

        $insertados = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            // Id_Factura_V, Fecha, Hora, Cliente, Vendedor, Observaciones, Cerrada, Finalizado, Creada_Por, Local
            [$idViejo, $fecha, , , $vendedorNit, $obs, $cerrada, , , $localId] = array_pad($row->toArray(), 10, null);
            if (!$idViejo) {
                continue;
            }

            $fechaVenta = $this->parsearFecha($fecha);
            $localUserId = $this->mapLocales[(int) $localId] ?? $this->userPorDefecto;
            $vendedorId = $this->mapUsers[trim((string) $vendedorNit)] ?? $this->userPorDefecto;

            if (!$this->dryRun) {
                $this->mapVentas[$idViejo] = DB::table('ventas')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'user_id' => $localUserId,    // local receptor
                    'fecha' => $fechaVenta ? date('Y-m-d', strtotime($fechaVenta)) : now()->toDateString(),
                    'estado' => $cerrada ? 'cerrada' : 'abierta',
                    'observaciones' => $obs,
                    'subtotal' => 0,
                    'total' => 0,
                    'creado_por' => $vendedorId,  // vendedor que registró
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $this->mapVentas[$idViejo] = 90000 + (int) $idViejo;
            }
            ++$insertados;
        }

        $this->log("  {$insertados} cabeceras insertadas");
        $this->log('  Leyendo detalles de venta desde INVENTARIO...');

        $di = $do = 0;
        $totales = [];
        $batch = [];
        $now = now();

        DB::beginTransaction();
        try {
            $this->iterarCsvInventario(function ($row, $index) use (&$totales, &$di, &$do, &$batch, $now) {
                if ($index === 1) {
                    return;
                }

                if ((int) ($row[7] ?? 0) !== 2) {
                    return;
                }
                $fv = $row[10] ?? null;
                $ref = $row[2] ?? null;
                if (!$fv || !$ref) {
                    return;
                }

                $ventaId = $this->mapVentas[$fv] ?? null;
                $refId = $this->mapReferencias[$ref] ?? null;
                if (!$ventaId || !$refId) {
                    ++$do;

                    return;
                }

                $precio = (int) ($row[18] ?: $row[19] ?: $row[11] ?: 0);
                $cant = (int) ($row[3] ?? 1);
                $subtotal = $precio * $cant;

                if (!$this->dryRun) {
                    $batch[] = [
                        'venta_id' => $ventaId,
                        'producto_id' => $refId,
                        'bodega_id' => $this->mapBodegas[$row[6] ?? null] ?? null,
                        'estanteria_id' => $this->mapEstanterias[$row[6] ?? null] ?? null,
                        'talla' => trim((string) ($row[4] ?? '')),
                        'cantidad' => $cant,
                        'precio_unitario' => $precio,
                        'subtotal' => $subtotal,
                        'estado' => 'vendido',
                        'email_verified_at' => now(),
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if (count($batch) >= 500) {
                        DB::table('venta_detalles')->insert($batch);
                        $batch = [];
                    }

                    $totales[$ventaId] = ($totales[$ventaId] ?? 0) + $subtotal;
                }
                ++$di;
            });

            if (!empty($batch)) {
                DB::table('venta_detalles')->insert($batch);
            }

            if (!$this->dryRun) {
                foreach ($totales as $vId => $t) {
                    DB::table('ventas')->where('id', $vId)->update([
                        'subtotal' => $t,
                        'total' => $t,
                        'updated_at' => $now,
                    ]);
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->log("  Detalles: {$di} insertados | {$do} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // 11. MUESTRAS
    // ─────────────────────────────────────────────────────
    private function importarMuestras(): void
    {
        $this->ensureMaps();

        // Construir mapa local→muestraBodega→lado desde UBICACION_CALZADO
        // Locales (tipo=1) con campo Muestra>0 apuntan a una bodega de muestras (tipo=3)
        // Lado: 1=DERECHO, 2=IZQUIERDO, 3=COMPLETO
        $rows = $this->loadSheet('UBICACION_CALZADO');
        if ($rows->isEmpty()) {
            $this->log('  Hoja UBICACION_CALZADO no encontrada');

            return;
        }

        // muestraBodegaId → [{localId, lado}]
        $muestraBodegaToLocales = [];
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            $rowArr = $row->toArray();
            $idUbicacion = (int) ($rowArr[0] ?? 0);
            $tipo = (int) ($rowArr[2] ?? 0);
            $muestraBodega = (int) ($rowArr[4] ?? 0);
            $lado = (int) ($rowArr[5] ?? 0);

            // Solo locales (tipo=1) que tienen muestra asignada
            if ($tipo !== 1 || $muestraBodega === 0) {
                continue;
            }

            $muestraBodegaToLocales[$muestraBodega][] = [
                'localViejo' => $idUbicacion,
                'lado' => $lado, // 1=DER, 2=IZQ, 3=COMPLETO
            ];
        }

        if (empty($muestraBodegaToLocales)) {
            $this->log('  No se encontraron locales con muestras asignadas');

            return;
        }

        $this->log('  Bodegas de muestras: ' . implode(', ', array_keys($muestraBodegaToLocales)));

        // Mapear locales viejos → user IDs del nuevo sistema
        $this->buildMapLocalesFromSheet();

        // Iterar CSV de inventario buscando registros en bodegas de muestras
        $muestras = [];
        $this->iterarCsvInventario(function ($row, $index) use (&$muestras, $muestraBodegaToLocales) {
            if ($index === 1) {
                return;
            }

            // Solo Movimiento=1 (en stock), no vendidos, no cancelados
            if ((int) ($row[7] ?? 0) !== 1) {
                return;
            }
            if (!empty($row[10])) {
                return;
            }
            $cancelado = strtolower(trim((string) ($row[20] ?? '')));
            if ($cancelado === '1' || $cancelado === 'true') {
                return;
            }

            $ubicacion = (int) ($row[6] ?? 0);
            if (!isset($muestraBodegaToLocales[$ubicacion])) {
                return;
            }

            $ref = $row[2] ?? null;
            $talla = (string) ($row[4] ?? '');
            $derecho = strtolower(trim((string) ($row[22] ?? '')));
            $izquierdo = strtolower(trim((string) ($row[23] ?? '')));
            $isDer = ($derecho === 'true' || $derecho === '1');
            $isIzq = ($izquierdo === 'true' || $izquierdo === '1');

            if (!$isDer && !$isIzq) {
                return;
            }
            if (!$ref) {
                return;
            }

            // Determinar variante/etiquetas
            $etiquetas = [];
            if ($isDer) {
                $etiquetas[] = 'Derecho';
            }
            if ($isIzq) {
                $etiquetas[] = 'Izquierdo';
            }

            // Asignar a cada local que usa esta bodega de muestras
            foreach ($muestraBodegaToLocales[$ubicacion] as $localInfo) {
                $key = "{$ref}|{$talla}|{$localInfo['localViejo']}";

                // Filtrar por lado del local
                $localEtiquetas = $etiquetas;
                if ($localInfo['lado'] === 1) {
                    // Solo Derecho
                    $localEtiquetas = array_filter($etiquetas, fn($e) => $e === 'Derecho');
                } elseif ($localInfo['lado'] === 2) {
                    // Solo Izquierdo
                    $localEtiquetas = array_filter($etiquetas, fn($e) => $e === 'Izquierdo');
                }
                // lado=3 → Completo, toma ambas

                if (empty($localEtiquetas)) {
                    continue;
                }

                if (!isset($muestras[$key])) {
                    $muestras[$key] = [
                        'ref' => $ref,
                        'talla' => $talla,
                        'ubicacion' => $ubicacion,
                        'localViejo' => $localInfo['localViejo'],
                        'etiquetas' => array_values($localEtiquetas),
                    ];
                }
            }
        });

        if (empty($muestras)) {
            $this->log('  No se encontraron muestras en el inventario');

            return;
        }

        $this->log('  ' . count($muestras) . ' muestras encontradas, insertando...');

        $insertados = $omitidos = 0;
        $batch = [];
        $now = now();

        DB::beginTransaction();
        try {
            foreach ($muestras as $item) {
                $refId = $this->mapReferencias[$item['ref']] ?? null;
                if (!$refId) {
                    ++$omitidos;
                    continue;
                }

                // Buscar inventario correspondiente
                $estId = $this->mapEstanterias[$item['ubicacion']] ?? null;
                $inventarioId = null;
                if ($estId) {
                    $inv = DB::table('inventarios')
                        ->where('referencia_id', $refId)
                        ->where('estanteria_id', $estId)
                        ->where('talla', $item['talla'])
                        ->where('cuenta_id', $this->cuentaId)
                        ->first();
                    $inventarioId = $inv->id ?? null;
                }

                // Resolver local → userId
                $localUserId = $this->mapLocales[(int) $item['localViejo']] ?? $this->userPorDefecto;

                $variante = implode(' / ', $item['etiquetas']);

                if (!$this->dryRun) {
                    $batch[] = [
                        'local_id' => $localUserId,
                        'referencia_id' => $refId,
                        'inventario_id' => $inventarioId,
                        'variante' => $variante,
                        'etiquetas' => json_encode($item['etiquetas']),
                        'cuenta_id' => $this->cuentaId,
                        'estado' => 'activo',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if (count($batch) >= 500) {
                        DB::table('muestras')->insert($batch);
                        $batch = [];
                    }
                }
                ++$insertados;
            }

            if (!empty($batch)) {
                DB::table('muestras')->insert($batch);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->log("  {$insertados} muestras insertadas | {$omitidos} omitidas");
    }

    // ─────────────────────────────────────────────────────
    // LOCALES → mapLocales (Id_Ubicacion → userId)
    // ─────────────────────────────────────────────────────
    private function buildMapLocalesFromSheet(): void
    {
        $rows = $this->loadSheet('LOCALES');
        if ($rows->isEmpty()) {
            $this->log('  Hoja LOCALES no encontrada — usando mapeo existente');

            return;
        }

        // Resetear map para evitar mapeos incorrectos por Orden_de_ingreso
        $this->mapLocales = [];

        // Crear lookup nombre→userId desde usuarios en DB
        $dbUsers = DB::table('users')
            ->where('cuenta_id', $this->cuentaId)
            ->select('id', 'name')
            ->get();

        $usersByName = [];
        foreach ($dbUsers as $u) {
            $usersByName[strtoupper(trim($u->name))] = $u->id;
        }

        $matched = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            [$idUbicacion, $ubicacion] = array_pad($row->toArray(), 2, null);
            if (!$idUbicacion || !$ubicacion) {
                continue;
            }

            // Normalizar: NICOLAS_QUINTERO → NICOLAS QUINTERO
            $nombreNorm = strtoupper(str_replace('_', ' ', trim($ubicacion)));
            $userId = $usersByName[$nombreNorm] ?? null;

            if ($userId) {
                $this->mapLocales[(int) $idUbicacion] = $userId;
                ++$matched;
            } else {
                $this->mapLocales[(int) $idUbicacion] = $this->userPorDefecto;
            }
        }

        $this->log("  Locales mapeados: " . count($this->mapLocales) . " total, {$matched} con usuario");
    }

    // ─────────────────────────────────────────────────────
    // CSV INVENTARIO — generación y reutilización
    // ─────────────────────────────────────────────────────
    private function ensureCsvInventario(): ?string
    {
        if ($this->csvInventarioPath && file_exists($this->csvInventarioPath)) {
            return $this->csvInventarioPath;
        }

        // Si se proporcionó un CSV externo, usarlo directamente
        if ($this->csvFilePath && file_exists($this->csvFilePath)) {
            $this->csvInventarioPath = $this->csvFilePath;
            $this->log('  Usando CSV de inventario proporcionado: ' . basename($this->csvFilePath));

            return $this->csvFilePath;
        }

        $uploadId = $this->jobKey ?: 'default';
        $csvPath = storage_path("app/importacion/{$uploadId}_inventario.csv");

        if (file_exists($csvPath)) {
            $this->csvInventarioPath = $csvPath;

            return $csvPath;
        }

        $this->log('  Generando CSV de hoja INVENTARIO desde Excel...');
        $success = ExcelToCsvConverter::convert($this->filePath, $csvPath, 'INVENTARIO');

        if (!$success) {
            return null;
        }

        $this->csvInventarioPath = $csvPath;

        return $csvPath;
    }

    private function iterarCsvInventario(callable $callback): void
    {
        $csvPath = $this->ensureCsvInventario();
        if (!$csvPath) {
            $this->log('  WARN: No se pudo obtener CSV de INVENTARIO para iterar.');

            return;
        }

        $handle = fopen($csvPath, 'r');

        // Auto-detectar delimitador
        $firstLine = fgets($handle);
        rewind($handle);
        $delimiter = ',';
        if ($firstLine) {
            $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        }

        $index = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            ++$index;
            $callback($row, $index);
        }

        fclose($handle);
    }

    // ─────────────────────────────────────────────────────
    // ENSURE MAPS — pre-cargar mapReferencias / mapEstanterias
    // cuando se corre inventario sin pasos previos
    // ─────────────────────────────────────────────────────
    private function ensureMaps(): void
    {
        // Referencias: codigo = str_pad(old_id, 6, '0'), así que old_id = (int)codigo
        if (empty($this->mapReferencias)) {
            $refs = DB::table('referencias')
                ->where('cuenta_id', $this->cuentaId)
                ->select('id', 'codigo')
                ->get();
            foreach ($refs as $r) {
                $oldId = (string) (int) $r->codigo;
                $this->mapReferencias[$oldId] = $r->id;
            }
            if (!empty($this->mapReferencias)) {
                $this->log('  Pre-cargados ' . count($this->mapReferencias) . ' referencias del DB');
            }
        }

        // Estanterías: mapa oldBodegaId → estanteriaId (GENERAL)
        // Usa el JSON guardado al importar bodegas (no requiere Excel)
        if (empty($this->mapEstanterias)) {
            $this->cargarMapaBodegas();
        }
    }

    /**
     * Guarda el mapa idViejo→nombreBodega en un JSON para futuros imports sin Excel.
     */
    private function guardarMapaBodegas(): void
    {
        $dir = storage_path('app/importacion/maps');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Reconstruir mapa idViejo→nombre desde la hoja UBICACION_CALZADO
        $mapa = [];
        $rows = $this->loadSheet('UBICACION_CALZADO');
        foreach ($rows as $i => $row) {
            if ($i === 0) {
                continue;
            }
            $rowArr = $row->toArray();
            $idViejo = $rowArr[0] ?? null;
            $nombre = strtoupper(trim($rowArr[1] ?? ''));
            if ($idViejo && $nombre) {
                $mapa[(string) $idViejo] = $nombre;
            }
        }

        if (!empty($mapa)) {
            $file = "{$dir}/cuenta_{$this->cuentaId}_bodegas.json";
            file_put_contents($file, json_encode($mapa, JSON_UNESCAPED_UNICODE));
            $this->log('  Mapa de bodegas guardado (' . count($mapa) . ' entradas)');
        }
    }

    /**
     * Carga mapEstanterias y mapBodegas desde el JSON persistido + DB.
     */
    private function cargarMapaBodegas(): void
    {
        $file = storage_path("app/importacion/maps/cuenta_{$this->cuentaId}_bodegas.json");
        if (!file_exists($file)) {
            $this->log('  WARN: No se encontró mapa de bodegas. Importa primero los datos maestros (sección 1).');

            return;
        }

        $mapa = json_decode(file_get_contents($file), true) ?: [];

        // Buscar cada bodega por nombre en DB y obtener su estantería GENERAL
        $bodegaMap = DB::table('bodegas')
            ->where('cuenta_id', $this->cuentaId)
            ->pluck('id', 'nombre')
            ->toArray();

        $estMap = DB::table('estanterias')
            ->whereIn('bodega_id', array_values($bodegaMap))
            ->where('nombre', 'GENERAL')
            ->pluck('id', 'bodega_id')
            ->toArray();

        foreach ($mapa as $idViejo => $nombre) {
            $bodegaId = $bodegaMap[$nombre] ?? null;
            if ($bodegaId && isset($estMap[$bodegaId])) {
                $this->mapEstanterias[(string) $idViejo] = $estMap[$bodegaId];
                $this->mapBodegas[(string) $idViejo] = $bodegaId;
            }
        }

        if (!empty($this->mapEstanterias)) {
            $this->log('  Pre-cargados ' . count($this->mapEstanterias) . ' estanterías desde mapa guardado');
        }
    }

    // ─────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────
    private function resolverRolLocal(): void
    {
        $rol = DB::table('roles')->where('name', 'local')->first();
        $this->rolLocalId = $rol ? (int) $rol->id : 0;
        if (!$this->rolLocalId) {
            $this->log('⚠ Rol "local" no encontrado — users se crearán sin rol');
        }
    }

    private function obtenerUserPorDefecto(): int
    {
        if ($this->dryRun) {
            return 1;
        }
        $user = DB::table('users')->where('cuenta_id', $this->cuentaId)->first();

        return $user ? (int) $user->id : 1;
    }

    private function crearProveedorGenerico(string $nit): ?int
    {
        if (!$nit || $this->dryRun) {
            return $this->dryRun ? 1 : null;
        }

        $existing = DB::table('proveedores')
            ->where('cuenta_id', $this->cuentaId)
            ->where(function ($q) use ($nit) {
                $q->where('documento', $nit)->orWhere('nombre', strtoupper($nit));
            })->first();

        if ($existing) {
            $this->mapProveedores[$nit] = $existing->id;

            return $existing->id;
        }

        $id = DB::table('proveedores')->insertGetId([
            'cuenta_id' => $this->cuentaId,
            'nombre' => strtoupper($nit),
            'tipo_documento' => 'NIT',
            'documento' => $nit,
            'creado_por' => $this->userPorDefecto ?: null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->mapProveedores[$nit] = $id;

        return $id;
    }

    private function parsearFecha(mixed $valor): ?string
    {
        if (!$valor) {
            return null;
        }
        if ($valor instanceof \DateTime) {
            return $valor->format('Y-m-d H:i:s');
        }
        if (is_numeric($valor)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $valor)->format('Y-m-d H:i:s');
            } catch (\Throwable) {
            }
        }
        try {
            return Carbon::parse($valor)->format('Y-m-d H:i:s');
        } catch (\Throwable) {
            return null;
        }
    }
}
