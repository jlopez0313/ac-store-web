<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Carbon\Carbon;

/**
 * Importa datos del sistema viejo (Access/Excel) al sistema nuevo.
 *
 * Mapeo de tipos de usuario viejo → roles nuevo:
 *   Id_tipo_usuario = 1  → rol "local"   (vendedores)
 *   Id_tipo_usuario = 2  → rol "local"   (clientes = locales en el nuevo)
 *   Id_tipo_usuario = 3  → tabla proveedores (no son users)
 *
 * Orden de ejecución:
 *   1. categorias    (TALLAS CURVAS + GENEROS → categorias.variaciones_json)
 *   2. marcas
 *   3. users_locales (USUARIOS tipo 1 y 2 → users con rol local)
 *   4. proveedores   (USUARIOS tipo 3)
 *   5. bodegas       (UBICACION_CALZADO → bodegas + estanterias)
 *   6. referencias   (REFERENCIAS)
 *   7. inventario    (INVENTARIO disponible → inventarios + subdivision_stock)
 *   8. traslados     (TRASLADOS)
 *   9. compras       (FACTURAS_COMPRAS + detalles desde INVENTARIO)
 *  10. ventas        (FACTURAS_VENTAS + detalles desde INVENTARIO)
 */
class ImportarSistemaViejo extends Command
{
    protected $signature = 'importar:sistema-viejo
                            {--file=   : Ruta al Excel (default: storage/app/importacion/datos.xlsx)}
                            {--cuenta= : ID de la cuenta destino (obligatorio)}
                            {--solo=   : Importar solo un paso: categorias|marcas|users_locales|proveedores|bodegas|referencias|inventario|traslados|compras|ventas}
                            {--dry-run : Simular sin insertar nada}';

    protected $description = 'Importa datos del sistema viejo (Access/Excel) al sistema nuevo';

    private int $cuentaId;
    private bool $dryRun = false;
    private int $userPorDefecto = 1;

    // Mapas viejo → nuevo
    private array $mapMarcas = [];  // id_viejo → marca_id
    private array $mapUsers = [];  // Nit_Cedula → user_id
    private array $mapProveedores = [];  // Nit_Cedula → proveedor_id
    private array $mapBodegas = [];  // Id_Ubicacion → bodega_id
    private array $mapEstanterias = [];  // Id_Ubicacion → estanteria_id (GENERAL)
    private array $mapReferencias = [];  // Referencia (int) → referencia_id
    private array $mapCompras = [];  // Id_Factura_C → compra_id
    private array $mapVentas = [];  // Id_Factura_V → venta_id

    private int $rolLocalId = 0;
    private $spreadsheet;

    // ─────────────────────────────────────────────────────
    // ENTRY POINT
    // ─────────────────────────────────────────────────────
    public function handle(): int
    {
        $this->dryRun = (bool) $this->option('dry-run');

        $cuentaOpt = $this->option('cuenta');
        if (!$cuentaOpt) {
            $this->error('Debes indicar --cuenta=ID');
            return 1;
        }

        $cuenta = DB::table('cuentas')->find($cuentaOpt);
        if (!$cuenta) {
            $this->error("No existe cuenta con ID {$cuentaOpt}");
            return 1;
        }

        $this->cuentaId = (int) $cuenta->id;
        $this->info("Cuenta: [{$this->cuentaId}] {$cuenta->nombre}");

        $file = $this->option('file') ?? storage_path('app/importacion/datos.xlsx');
        if (!file_exists($file)) {
            $this->error("Archivo no encontrado: {$file}");
            $this->line('Copia el Excel a storage/app/importacion/datos.xlsx o usa --file=ruta');
            return 1;
        }

        if ($this->dryRun) {
            $this->warn('⚠  MODO DRY-RUN — no se insertará nada');
        }

        $this->info('Cargando Excel (puede tardar unos segundos)...');
        $this->spreadsheet = IOFactory::load($file);

        $this->resolverRolLocal();
        $this->userPorDefecto = $this->obtenerUserPorDefecto();

        $solo = $this->option('solo');

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
        ];

        foreach ($pasos as $nombre => $fn) {
            if ($solo && $solo !== $nombre)
                continue;
            $this->line('');
            $this->info("━━━ {$nombre} ━━━");
            try {
                $fn();
            } catch (\Throwable $e) {
                $this->error("Error en {$nombre}: " . $e->getMessage());
                $this->line($e->getTraceAsString());
                if (!$this->confirm('¿Continuar con el siguiente paso?')) {
                    return 1;
                }
            }
        }

        $this->line('');
        $this->info('✅ Importación completada.');
        return 0;
    }

    // ─────────────────────────────────────────────────────
    // 1. CATEGORÍAS
    // Origen: GENEROS + TALLAS CURVAS del Excel
    // Destino: categorias (variaciones_json, subdivision_stock)
    // ─────────────────────────────────────────────────────
    private function importarCategorias(): void
    {
        $wsGeneros = $this->spreadsheet->getSheetByName('GENEROS');
        $wsTallas = $this->spreadsheet->getSheetByName('TALLAS CURVAS');

        if (!$wsGeneros || !$wsTallas) {
            $this->warn('  Hojas GENEROS / TALLAS CURVAS no encontradas — usando categoría por defecto');
            $this->crearCategoria('CALZADO', ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], 'CAL');
            return;
        }

        // Leer géneros: id → nombre
        $generos = [];
        foreach ($wsGeneros->toArray(null, true, true, false) as $i => $row) {
            if ($i === 0 || !$row[0])
                continue;
            $generos[(int) $row[0]] = strtoupper(trim($row[1]));
        }

        // Agrupar tallas por género (excluir U y C = controles internos)
        $tallasPorGenero = [];
        foreach ($wsTallas->toArray(null, true, true, false) as $i => $row) {
            if ($i === 0 || !$row[0])
                continue;
            [, $idGenero, $talla] = array_pad($row, 3, null);
            if (!$idGenero || !$talla)
                continue;
            $tallaStr = trim((string) $talla);
            if (in_array($tallaStr, ['U', 'C', ''], true))
                continue;
            $tallasPorGenero[(int) $idGenero][] = $tallaStr;
        }

        foreach ($tallasPorGenero as $idGenero => $tallas) {
            $nombre = $generos[$idGenero] ?? "GENERO_{$idGenero}";
            $prefijo = substr(preg_replace('/[^A-Z]/', '', $nombre), 0, 3) ?: 'CAL';
            $this->crearCategoria($nombre, array_values(array_unique($tallas)), $prefijo);
        }
    }

    private function crearCategoria(string $nombre, array $tallas, string $prefijo): int
    {
        if ($this->dryRun) {
            $this->line("  [dry] Categoría: {$nombre} — " . implode(',', $tallas));
            return 1;
        }

        $existing = DB::table('categorias')->where('nombre', $nombre)->first();
        if ($existing) {
            $this->line("  Categoría ya existe: {$nombre} (id={$existing->id})");
            return (int) $existing->id;
        }

        $id = DB::table('categorias')->insertGetId([
            'nombre' => $nombre,
            'tipo_control' => 'tallas',
            'subdivision_stock' => json_encode(['Izquierdo', 'Derecho']),
            'variaciones_json' => json_encode(array_values($tallas)),
            'prefijo_sku' => $prefijo,
            'creado_por' => $this->userPorDefecto ?: null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->line("  Categoría creada: {$nombre} — tallas: " . implode(',', $tallas) . " (id={$id})");
        return $id;
    }

    // ─────────────────────────────────────────────────────
    // 2. MARCAS
    // ─────────────────────────────────────────────────────
    private function importarMarcas(): void
    {
        $ws = $this->spreadsheet->getSheetByName('MARCAS');
        if (!$ws) {
            $this->warn('  Hoja MARCAS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);

        $insertados = 0;
        foreach ($rows as $row) {
            [$idViejo, $nombre] = array_pad($row, 2, null);
            if (!$idViejo || !$nombre)
                continue;

            $nombre = strtoupper(trim($nombre));

            if (!$this->dryRun) {
                $existing = DB::table('marcas')
                    ->where('nombre', $nombre)
                    ->where(function ($q) {
                        $q->where('cuenta_id', $this->cuentaId)->orWhereNull('cuenta_id');
                    })
                    ->first();

                if ($existing) {
                    $this->mapMarcas[$idViejo] = $existing->id;
                } else {
                    $newId = DB::table('marcas')->insertGetId([
                        'nombre' => $nombre,
                        'cuenta_id' => $this->cuentaId,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $this->mapMarcas[$idViejo] = $newId;
                    $insertados++;
                }
            } else {
                $this->mapMarcas[$idViejo] = 9000 + (int) $idViejo;
                $insertados++;
            }
        }

        $this->line("  Marcas: {$insertados} insertadas / " . count($this->mapMarcas) . ' mapeadas');
    }

    // ─────────────────────────────────────────────────────
    // 3. USERS LOCALES
    // USUARIOS tipo 1 y 2 → users con rol "local"
    // Password inicial = Nit_Cedula (deben cambiarlo)
    // ─────────────────────────────────────────────────────
    private function importarUsersLocales(): void
    {
        $ws = $this->spreadsheet->getSheetByName('USUARIOS');
        if (!$ws) {
            $this->warn('  Hoja USUARIOS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);
        // Nombre, Nit_Cedula, Telefono, Direccion, email, Ciudad, Id_tipo_usuario, Orden, Local

        $insertados = 0;
        foreach ($rows as $row) {
            [$nombre, $nit, , , $email, , $tipo] = array_pad($row, 7, null);
            if (!$nombre)
                continue;
            if (!in_array((int) $tipo, [1, 2], true))
                continue;

            $nombre = strtoupper(trim($nombre));
            $nit = trim((string) $nit);
            $base = 'local_' . preg_replace('/[^a-z0-9]/', '_', strtolower($nombre));
            $username = $base . '_' . substr($nit, -4);
            $emailUso = $email ?: ($username . '@sistema.local');

            if (!$this->dryRun) {
                $existing = DB::table('users')
                    ->where('cuenta_id', $this->cuentaId)
                    ->where('username', $username)
                    ->first();

                if ($existing) {
                    $this->mapUsers[$nit] = $existing->id;
                    continue;
                }

                // Garantizar username único globalmente
                $usernameUnico = $username;
                $suffix = 1;
                while (DB::table('users')->where('username', $usernameUnico)->exists()) {
                    $usernameUnico = $username . '_' . $suffix++;
                }

                $userId = DB::table('users')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'name' => $nombre,
                    'username' => $usernameUnico,
                    'email' => $emailUso,
                    'password' => Hash::make($nit ?: 'cambiar123'),
                    'estado' => 1,
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
                $insertados++;
            } else {
                $this->mapUsers[$nit] = 50000 + $insertados;
                $insertados++;
            }
        }

        $this->line("  Users locales: {$insertados} creados / " . count($this->mapUsers) . ' mapeados');
        if ($insertados > 0) {
            $this->line('  ⚠ Password inicial = Nit_Cedula del usuario. Pedir que cambien al primer login.');
        }
    }

    // ─────────────────────────────────────────────────────
    // 4. PROVEEDORES
    // USUARIOS tipo 3 → tabla proveedores
    // ─────────────────────────────────────────────────────
    private function importarProveedores(): void
    {
        $ws = $this->spreadsheet->getSheetByName('USUARIOS');
        if (!$ws) {
            $this->warn('  Hoja USUARIOS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);

        $insertados = 0;
        foreach ($rows as $row) {
            [$nombre, $nit, $telefono, , $email, , $tipo] = array_pad($row, 7, null);
            if (!$nombre || (int) $tipo !== 3)
                continue;

            $nombre = strtoupper(trim($nombre));
            $nit = trim((string) $nit);

            if (!$this->dryRun) {
                $existing = DB::table('proveedores')
                    ->where('documento', $nit ?: '000000')
                    ->where('cuenta_id', $this->cuentaId)
                    ->first();

                if ($existing) {
                    $this->mapProveedores[$nit] = $existing->id;
                } else {
                    $newId = DB::table('proveedores')->insertGetId([
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
                    $this->mapProveedores[$nit] = $newId;
                    $insertados++;
                }
            } else {
                $this->mapProveedores[$nit] = 60000 + $insertados;
                $insertados++;
            }
        }

        $this->line("  Proveedores: {$insertados} insertados / " . count($this->mapProveedores) . ' mapeados');
    }

    // ─────────────────────────────────────────────────────
    // 5. BODEGAS + ESTANTERÍAS
    // ─────────────────────────────────────────────────────
    private function importarBodegas(): void
    {
        $ws = $this->spreadsheet->getSheetByName('UBICACION_CALZADO');
        if (!$ws) {
            $this->warn('  Hoja UBICACION_CALZADO no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);
        // Id_Ubicacion, Ubicacion, Id_tipo_ubicacion, Activo, ...

        $insertadosBodegas = 0;
        $insertadosEstanterias = 0;

        foreach ($rows as $row) {
            [$idViejo, $nombre, , $activo] = array_pad($row, 4, null);
            if (!$idViejo || !$nombre)
                continue;
            if ((int) $idViejo === 0)
                continue;

            $nombre = strtoupper(trim($nombre));
            $estado = $activo ? 1 : 0;

            if (!$this->dryRun) {
                $existing = DB::table('bodegas')
                    ->where('nombre', $nombre)
                    ->where('cuenta_id', $this->cuentaId)
                    ->first();

                if ($existing) {
                    $bodegaId = $existing->id;
                } else {
                    $bodegaId = DB::table('bodegas')->insertGetId([
                        'cuenta_id' => $this->cuentaId,
                        'nombre' => $nombre,
                        'estado' => $estado,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $insertadosBodegas++;
                }
                $this->mapBodegas[$idViejo] = $bodegaId;

                // Estantería GENERAL por defecto
                $estExisting = DB::table('estanterias')
                    ->where('bodega_id', $bodegaId)
                    ->where('nombre', 'GENERAL')
                    ->first();

                if ($estExisting) {
                    $estId = $estExisting->id;
                } else {
                    $estId = DB::table('estanterias')->insertGetId([
                        'bodega_id' => $bodegaId,
                        'nombre' => 'GENERAL',
                        'estado' => 1,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $insertadosEstanterias++;
                }
                $this->mapEstanterias[$idViejo] = $estId;

            } else {
                $this->mapBodegas[$idViejo] = 9000 + (int) $idViejo;
                $this->mapEstanterias[$idViejo] = 8000 + (int) $idViejo;
                $insertadosBodegas++;
                $insertadosEstanterias++;
            }
        }

        $this->importarEstantesReales();

        $this->line("  Bodegas: {$insertadosBodegas} insertadas");
        $this->line("  Estanterías GENERAL: {$insertadosEstanterias} creadas");
    }

    private function importarEstantesReales(): void
    {
        $ws = $this->spreadsheet->getSheetByName('ESTANTES X BODEGA');
        if (!$ws)
            return;

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);

        $creados = [];
        $count = 0;

        foreach ($rows as $row) {
            [, $bodegaVieja, $estante] = array_pad($row, 3, null);
            if (!$bodegaVieja || !$estante)
                continue;

            $key = "{$bodegaVieja}_{$estante}";
            if (isset($creados[$key]))
                continue;

            $bodegaId = $this->mapBodegas[$bodegaVieja] ?? null;
            if (!$bodegaId)
                continue;

            $nombre = 'ESTANTE ' . strtoupper(trim((string) $estante));

            if (!$this->dryRun) {
                $exists = DB::table('estanterias')
                    ->where('bodega_id', $bodegaId)
                    ->where('nombre', $nombre)
                    ->exists();

                if (!$exists) {
                    DB::table('estanterias')->insert([
                        'bodega_id' => $bodegaId,
                        'nombre' => $nombre,
                        'estado' => 1,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $count++;
                }
            }
            $creados[$key] = true;
        }

        if ($count > 0)
            $this->line("  Estantes detallados: {$count} creados");
    }

    // ─────────────────────────────────────────────────────
    // 6. REFERENCIAS
    // ─────────────────────────────────────────────────────
    private function importarReferencias(): void
    {
        // Mapa genero_viejo → categoria_id nuevo
        $categorias = DB::table('categorias')->pluck('id', 'nombre')->toArray();

        $generoCatMap = [];
        $categoriaDefault = array_values($categorias)[0] ?? 1;

        $wsGeneros = $this->spreadsheet->getSheetByName('GENEROS');
        if ($wsGeneros) {
            foreach ($wsGeneros->toArray(null, true, true, false) as $i => $row) {
                if ($i === 0 || !$row[0])
                    continue;
                $nombre = strtoupper(trim($row[1]));
                if (isset($categorias[$nombre])) {
                    $generoCatMap[(int) $row[0]] = $categorias[$nombre];
                }
            }
        }

        $ws = $this->spreadsheet->getSheetByName('REFERENCIAS');
        if (!$ws) {
            $this->warn('  Hoja REFERENCIAS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);
        // Referencia, Marca, Descripcion, FilePath, Genero, Orden, Precio, PDV1, PDV2, Etiqueta

        $insertados = 0;
        $bar = $this->output->createProgressBar(count($rows));

        foreach ($rows as $row) {
            [$refVieja, $marcaVieja, $descripcion, , $genero] = array_pad($row, 5, null);
            $bar->advance();
            if (!$refVieja || !$descripcion)
                continue;

            $codigo = str_pad((string) (int) $refVieja, 6, '0', STR_PAD_LEFT);
            $descripcion = strtoupper(trim($descripcion));
            $marcaId = $this->mapMarcas[$marcaVieja] ?? null;
            $catId = $generoCatMap[(int) $genero] ?? $categoriaDefault;

            if (!$this->dryRun) {
                $existing = DB::table('referencias')
                    ->where('codigo', $codigo)
                    ->where('cuenta_id', $this->cuentaId)
                    ->first();

                if ($existing) {
                    $this->mapReferencias[$refVieja] = $existing->id;
                } else {
                    $newId = DB::table('referencias')->insertGetId([
                        'codigo' => $codigo,
                        'descripcion' => $descripcion,
                        'categoria_id' => $catId,
                        'marca_id' => $marcaId,
                        'cuenta_id' => $this->cuentaId,
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $this->mapReferencias[$refVieja] = $newId;
                    $insertados++;
                }
            } else {
                $this->mapReferencias[$refVieja] = 70000 + (int) $refVieja;
                $insertados++;
            }
        }

        $bar->finish();
        $this->line('');
        $this->line("  Referencias: {$insertados} insertadas / " . count($this->mapReferencias) . ' mapeadas');
    }

    // ─────────────────────────────────────────────────────
    // 7. INVENTARIO
    // Solo disponible: movimiento=1, sin venta, no cancelado
    // subdivision_stock = {"Izquierdo": N, "Derecho": N}
    // ─────────────────────────────────────────────────────
    private function importarInventario(): void
    {
        $ws = $this->spreadsheet->getSheetByName('INVENTARIO');
        if (!$ws) {
            $this->warn('  Hoja INVENTARIO no encontrada');
            return;
        }

        $this->line('  Leyendo INVENTARIO (~202k filas, puede tardar 1-2 min)...');

        $agrupado = [];

        foreach ($ws->getRowIterator(2) as $excelRow) {
            $cells = $excelRow->getCellIterator();
            $cells->setIterateOnlyExistingCells(false);
            $row = [];
            foreach ($cells as $cell) {
                $row[] = $cell->getValue();
            }

            // índices: 0=Cod 1=FacturaCompra 2=Referencia 3=Cant 4=Talla 5=P_Costo
            //          6=Ubicacion 7=Movimiento ... 10=Factura_venta 11=P_Venta ...
            //          18=PDV1 19=PDV2 20=Cancelado 22=Derecho 23=Izquierdo

            if ((int) ($row[7] ?? 0) !== 1)
                continue; // solo ingresos
            if ($row[10] ?? null)
                continue; // ya vendido
            if ($row[20] ?? null)
                continue; // cancelado
            if (!($row[2] ?? null))
                continue; // sin referencia
            if (!($row[6] ?? null))
                continue; // sin ubicación

            $refVieja = $row[2];
            $ubicacion = $row[6];
            $talla = trim((string) ($row[4] ?? ''));
            $key = "{$refVieja}_{$talla}_{$ubicacion}";

            if (!isset($agrupado[$key])) {
                $agrupado[$key] = [
                    'refVieja' => $refVieja,
                    'talla' => $talla,
                    'ubicacion' => $ubicacion,
                    'stock' => 0,
                    'izquierdo' => 0,
                    'derecho' => 0,
                    'p_costo' => (int) ($row[5] ?? 0),
                    'p_venta' => (int) ($row[18] ?? $row[19] ?? $row[11] ?? 0),
                ];
            }

            $agrupado[$key]['stock'] += (int) ($row[3] ?? 1);
            $agrupado[$key]['izquierdo'] += (int) ($row[23] ?? 0);
            $agrupado[$key]['derecho'] += (int) ($row[22] ?? 0);
        }

        $this->line('  Grupos de stock: ' . count($agrupado));

        $insertados = 0;
        $omitidos = 0;
        $bar = $this->output->createProgressBar(count($agrupado));

        foreach ($agrupado as $item) {
            $bar->advance();

            $refId = $this->mapReferencias[$item['refVieja']] ?? null;
            $estId = $this->mapEstanterias[$item['ubicacion']] ?? null;

            if (!$refId || !$estId || $item['stock'] <= 0) {
                $omitidos++;
                continue;
            }

            $subdivisionStock = json_encode([
                'Izquierdo' => $item['izquierdo'],
                'Derecho' => $item['derecho'],
            ]);

            if (!$this->dryRun) {
                $existing = DB::table('inventarios')
                    ->where('referencia_id', $refId)
                    ->where('estanteria_id', $estId)
                    ->where('talla', $item['talla'])
                    ->where('cuenta_id', $this->cuentaId)
                    ->first();

                if ($existing) {
                    DB::table('inventarios')->where('id', $existing->id)->update([
                        'stock' => $existing->stock + $item['stock'],
                        'subdivision_stock' => $subdivisionStock,
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('inventarios')->insert([
                        'cuenta_id' => $this->cuentaId,
                        'referencia_id' => $refId,
                        'estanteria_id' => $estId,
                        'talla' => $item['talla'],
                        'stock' => $item['stock'],
                        'subdivision_stock' => $subdivisionStock,
                        'precio_compra' => $item['p_costo'],
                        'precio_venta' => $item['p_venta'],
                        'creado_por' => $this->userPorDefecto ?: null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $insertados++;
                }
            } else {
                $insertados++;
            }
        }

        $bar->finish();
        $this->line('');
        $this->line("  Inventarios: {$insertados} insertados | {$omitidos} omitidos (sin mapeo o stock ≤0)");
    }

    // ─────────────────────────────────────────────────────
    // 8. TRASLADOS
    // ─────────────────────────────────────────────────────
    private function importarTraslados(): void
    {
        $ws = $this->spreadsheet->getSheetByName('TRASLADOS');
        if (!$ws) {
            $this->warn('  Hoja TRASLADOS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);
        // IdTraslado, Fecha, Hora, Referencia, Cantidad, Talla, Origen, Destino, Cajas, Recibido

        $insertados = 0;
        $omitidos = 0;

        foreach ($rows as $row) {
            [, $fecha, , $refVieja, $cantidad, $talla, $origen, $destino] = array_pad($row, 8, null);
            if (!$refVieja || !$origen || !$destino)
                continue;

            $refId = $this->mapReferencias[$refVieja] ?? null;
            $bodOrigen = $this->mapBodegas[$origen] ?? null;
            $estOrigen = $this->mapEstanterias[$origen] ?? null;
            $bodDest = $this->mapBodegas[$destino] ?? null;
            $estDest = $this->mapEstanterias[$destino] ?? null;

            if (!$refId || !$bodOrigen || !$bodDest) {
                $omitidos++;
                continue;
            }

            if (!$this->dryRun) {
                DB::table('traslados')->insert([
                    'cuenta_id' => $this->cuentaId,
                    'referencia_id' => $refId,
                    'talla' => trim((string) $talla),
                    'bodega_origen_id' => $bodOrigen,
                    'estanteria_origen_id' => $estOrigen,
                    'bodega_destino_id' => $bodDest,
                    'estanteria_destino_id' => $estDest ?? $estOrigen,
                    'cantidad' => (int) $cantidad,
                    'user_id' => $this->userPorDefecto,
                    'created_at' => $this->parsearFecha($fecha) ?? now(),
                    'updated_at' => now(),
                ]);
                $insertados++;
            } else {
                $insertados++;
            }
        }

        $this->line("  Traslados: {$insertados} insertados | {$omitidos} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // 9. COMPRAS + DETALLES
    // ─────────────────────────────────────────────────────
    private function importarCompras(): void
    {
        $ws = $this->spreadsheet->getSheetByName('FACTURAS_COMPRAS');
        if (!$ws) {
            $this->warn('  Hoja FACTURAS_COMPRAS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);
        // Id_Factura_C, Fecha, Hora, Proveedor(Nit), Observaciones, Cerrada

        $insertados = 0;
        $omitidos = 0;

        foreach ($rows as $row) {
            [$idViejo, $fecha, , $provNit, $obs, $cerrada] = array_pad($row, 6, null);
            if (!$idViejo)
                continue;

            $provNit = trim((string) $provNit);
            $provId = $this->mapProveedores[$provNit] ?? $this->crearProveedorGenerico($provNit);

            if (!$provId) {
                $omitidos++;
                continue;
            }

            $fechaCompra = $this->parsearFecha($fecha) ?? now()->toDateTimeString();

            if (!$this->dryRun) {
                $newId = DB::table('compras')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'proveedor_id' => $provId,
                    'estado' => $cerrada ? 'cerrada' : 'abierta',
                    'fecha_apertura' => $fechaCompra,
                    'fecha_cierre' => $cerrada ? $fechaCompra : null,
                    'flete' => 0,
                    'observaciones' => $obs,
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->mapCompras[$idViejo] = $newId;
                $insertados++;
            } else {
                $this->mapCompras[$idViejo] = 80000 + (int) $idViejo;
                $insertados++;
            }
        }

        $this->line("  Compras: {$insertados} insertadas | {$omitidos} sin proveedor");
        $this->importarDetallesCompra();
    }

    private function importarDetallesCompra(): void
    {
        $ws = $this->spreadsheet->getSheetByName('INVENTARIO');
        if (!$ws)
            return;

        $agrupado = [];

        foreach ($ws->getRowIterator(2) as $excelRow) {
            $cells = $excelRow->getCellIterator();
            $cells->setIterateOnlyExistingCells(false);
            $row = [];
            foreach ($cells as $cell)
                $row[] = $cell->getValue();

            if ((int) ($row[7] ?? 0) !== 1)
                continue;
            $facturaCompra = $row[1] ?? null;
            $refVieja = $row[2] ?? null;
            if (!$facturaCompra || !$refVieja)
                continue;

            $talla = trim((string) ($row[4] ?? ''));
            $key = "{$facturaCompra}_{$refVieja}_{$talla}";

            if (!isset($agrupado[$key])) {
                $agrupado[$key] = [
                    'compraVieja' => $facturaCompra,
                    'refVieja' => $refVieja,
                    'talla' => $talla,
                    'ubicacion' => $row[6] ?? null,
                    'cantidad' => 0,
                    'p_costo' => (int) ($row[5] ?? 0),
                    'p_venta' => (int) ($row[18] ?? $row[19] ?? $row[11] ?? 0),
                ];
            }
            $agrupado[$key]['cantidad'] += (int) ($row[3] ?? 1);
        }

        $insertados = $omitidos = 0;

        foreach ($agrupado as $item) {
            $compraId = $this->mapCompras[$item['compraVieja']] ?? null;
            $refId = $this->mapReferencias[$item['refVieja']] ?? null;
            $bodegaId = $this->mapBodegas[$item['ubicacion']] ?? null;

            if (!$compraId || !$refId || !$bodegaId) {
                $omitidos++;
                continue;
            }

            if (!$this->dryRun) {
                DB::table('compra_detalles')->insert([
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
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $insertados++;
            } else {
                $insertados++;
            }
        }

        $this->line("  Detalles compra: {$insertados} insertados | {$omitidos} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // 10. VENTAS + DETALLES
    // ─────────────────────────────────────────────────────
    private function importarVentas(): void
    {
        $ws = $this->spreadsheet->getSheetByName('FACTURAS_VENTAS');
        if (!$ws) {
            $this->warn('  Hoja FACTURAS_VENTAS no encontrada');
            return;
        }

        $rows = $ws->toArray(null, true, true, false);
        array_shift($rows);
        // Id_Factura_V, Fecha, Hora, Cliente, Vendedor, Observaciones, Cerrada, ...

        $insertados = 0;
        $bar = $this->output->createProgressBar(count($rows));

        foreach ($rows as $row) {
            [$idViejo, $fecha, , , , $obs, $cerrada] = array_pad($row, 7, null);
            if (!$idViejo) {
                $bar->advance();
                continue;
            }

            $fechaVenta = $this->parsearFecha($fecha);

            if (!$this->dryRun) {
                $newId = DB::table('ventas')->insertGetId([
                    'cuenta_id' => $this->cuentaId,
                    'user_id' => $this->userPorDefecto,
                    'fecha' => $fechaVenta ? date('Y-m-d', strtotime($fechaVenta)) : now()->toDateString(),
                    'estado' => $cerrada ? 'cerrada' : 'abierta',
                    'observaciones' => $obs,
                    'subtotal' => 0,
                    'total' => 0,
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->mapVentas[$idViejo] = $newId;
                $insertados++;
            } else {
                $this->mapVentas[$idViejo] = 90000 + (int) $idViejo;
                $insertados++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->line('');
        $this->line("  Ventas: {$insertados} insertadas");
        $this->importarDetallesVenta();
    }

    private function importarDetallesVenta(): void
    {
        $ws = $this->spreadsheet->getSheetByName('INVENTARIO');
        if (!$ws)
            return;

        $insertados = $omitidos = 0;
        $totales = [];

        foreach ($ws->getRowIterator(2) as $excelRow) {
            $cells = $excelRow->getCellIterator();
            $cells->setIterateOnlyExistingCells(false);
            $row = [];
            foreach ($cells as $cell)
                $row[] = $cell->getValue();

            if ((int) ($row[7] ?? 0) !== 2)
                continue; // solo salidas/ventas
            $facturaVenta = $row[10] ?? null;
            $refVieja = $row[2] ?? null;
            if (!$facturaVenta || !$refVieja)
                continue;

            $ventaId = $this->mapVentas[$facturaVenta] ?? null;
            $refId = $this->mapReferencias[$refVieja] ?? null;
            $bodegaId = $this->mapBodegas[$row[6] ?? null] ?? null;
            $estId = $this->mapEstanterias[$row[6] ?? null] ?? null;

            if (!$ventaId || !$refId) {
                $omitidos++;
                continue;
            }

            $precio = (int) ($row[18] ?? $row[19] ?? $row[11] ?? 0);
            $cant = (int) ($row[3] ?? 1);
            $subtotal = $precio * $cant;

            if (!$this->dryRun) {
                DB::table('venta_detalles')->insert([
                    'venta_id' => $ventaId,
                    'producto_id' => $refId,
                    'bodega_id' => $bodegaId,
                    'estanteria_id' => $estId,
                    'talla' => trim((string) ($row[4] ?? '')),
                    'cantidad' => $cant,
                    'precio_unitario' => $precio,
                    'subtotal' => $subtotal,
                    'estado' => 'vendido',
                    'creado_por' => $this->userPorDefecto ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $totales[$ventaId] = ($totales[$ventaId] ?? 0) + $subtotal;
                $insertados++;
            } else {
                $insertados++;
            }
        }

        // Actualizar totales
        if (!$this->dryRun) {
            foreach ($totales as $ventaId => $total) {
                DB::table('ventas')->where('id', $ventaId)->update([
                    'subtotal' => $total,
                    'total' => $total,
                    'updated_at' => now(),
                ]);
            }
        }

        $this->line("  Detalles venta: {$insertados} insertados | {$omitidos} omitidos");
    }

    // ─────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────
    private function resolverRolLocal(): void
    {
        $rol = DB::table('roles')->where('name', 'local')->first();
        $this->rolLocalId = $rol ? (int) $rol->id : 0;
        if (!$this->rolLocalId) {
            $this->warn('  ⚠ No se encontró el rol "local". Los users se crearán sin rol asignado.');
        }
    }

    private function obtenerUserPorDefecto(): int
    {
        if ($this->dryRun)
            return 1;
        $user = DB::table('users')->where('cuenta_id', $this->cuentaId)->first();
        return $user ? (int) $user->id : 1;
    }

    private function crearProveedorGenerico(string $nitONombre): ?int
    {
        if (!$nitONombre)
            return null;
        if ($this->dryRun)
            return 1;

        $existing = DB::table('proveedores')
            ->where('cuenta_id', $this->cuentaId)
            ->where(function ($q) use ($nitONombre) {
                $q->where('documento', $nitONombre)->orWhere('nombre', strtoupper($nitONombre));
            })
            ->first();

        if ($existing) {
            $this->mapProveedores[$nitONombre] = $existing->id;
            return $existing->id;
        }

        $id = DB::table('proveedores')->insertGetId([
            'cuenta_id' => $this->cuentaId,
            'nombre' => strtoupper($nitONombre),
            'tipo_documento' => 'NIT',
            'documento' => $nitONombre,
            'creado_por' => $this->userPorDefecto ?: null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->mapProveedores[$nitONombre] = $id;
        return $id;
    }

    private function parsearFecha(mixed $valor): ?string
    {
        if (!$valor)
            return null;
        if ($valor instanceof \DateTime)
            return $valor->format('Y-m-d H:i:s');
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
