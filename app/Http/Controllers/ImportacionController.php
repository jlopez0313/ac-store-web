<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\Cuenta;

class ImportacionController extends Controller
{
    public function index()
    {
        return Inertia::render('importacion/Index', [
            'cuentas' => Cuenta::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function ejecutar(Request $request)
    {
        $request->validate([
            'cuenta_id' => 'required|exists:cuentas,id',
            'archivo' => 'required|file|mimes:xlsx|max:51200', // 50MB máx
            'dry_run' => 'nullable|in:0,1',
            'solo' => 'nullable|in:marcas,proveedores,bodegas,referencias,inventario,compras,ventas',
        ]);

        // Guardar el archivo en storage temporal
        $path = $request->file('archivo')->storeAs(
            'importacion',
            'datos_' . $request->cuenta_id . '_' . time() . '.xlsx',
            'local'
        );

        $filePath = storage_path("app/{$path}");

        // Capturar output del comando Artisan
        $output = new \Symfony\Component\Console\Output\BufferedOutput();

        $params = [
            '--file' => $filePath,
            '--cuenta' => $request->cuenta_id,
        ];

        if ($request->dry_run === '1') {
            $params['--dry-run'] = true;
        }

        if ($request->solo) {
            $params['--solo'] = $request->solo;
        }

        try {
            $exitCode = Artisan::call('importar:sistema-viejo', $params, $output);
            $texto = $output->fetch();

            // Borrar archivo temporal
            Storage::disk('local')->delete($path);

            // Parsear output para extraer resumen por paso
            $pasos = $this->parsearPasos($texto);
            $resumen = $this->parsearResumen($texto);

            return back()->with('resultado', [
                'error' => $exitCode !== 0,
                'dry_run' => $request->dry_run === '1',
                'mensaje' => $texto,
                'pasos' => $pasos,
                'resumen' => $resumen,
            ]);

        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);

            return back()->with('resultado', [
                'error' => true,
                'dry_run' => $request->dry_run === '1',
                'mensaje' => $e->getMessage(),
                'pasos' => [],
                'resumen' => [],
            ]);
        }
    }

    /**
     * Extrae el último mensaje de cada sección del output
     * buscando líneas como "  Marcas: 12 insertadas / 12 mapeadas"
     */
    private function parsearPasos(string $texto): array
    {
        $mapa = [
            'marcas' => 'Marcas',
            'proveedores' => 'Proveedores',
            'bodegas' => 'Bodegas',
            'referencias' => 'Referencias',
            'inventario' => 'Inventarios',
            'compras' => 'Compras',
            'ventas' => 'Ventas',
        ];

        $resultado = [];
        $lineas = explode("\n", $texto);

        foreach ($mapa as $key => $patron) {
            foreach ($lineas as $linea) {
                if (str_contains($linea, $patron . ':')) {
                    $resultado[$key] = trim($linea);
                }
            }
        }

        return $resultado;
    }

    /**
     * Extrae números clave del output para mostrar en tarjetas de resumen
     */
    private function parsearResumen(string $texto): array
    {
        $resumen = [];

        $patrones = [
            'marcas' => '/Marcas:\s*(\d+) insertadas/',
            'referencias' => '/Referencias:\s*(\d+) insertadas/',
            'inventario' => '/Inventarios insertados:\s*(\d+)/',
            'ventas' => '/Ventas:\s*(\d+) insertadas/',
            'compras' => '/Compras:\s*(\d+) insertadas/',
        ];

        foreach ($patrones as $key => $pattern) {
            if (preg_match($pattern, $texto, $m)) {
                $resumen[$key] = (int) $m[1];
            }
        }

        return $resumen;
    }
}
