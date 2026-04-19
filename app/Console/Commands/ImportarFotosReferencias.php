<?php

namespace App\Console\Commands;

use App\Models\Referencia;
use App\Models\Cuenta;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class ImportarFotosReferencias extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'referencias:import-photos {cuenta_id} {--folder=FOTOS} {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importa fotos desde una carpeta y las asocia a las referencias de una cuenta específica';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cuentaId = $this->argument('cuenta_id');
        $folder = $this->option('folder');
        $dryRun = $this->option('dry-run');
        $absolutePath = base_path($folder);

        if (!File::exists($absolutePath)) {
            $this->error("La carpeta de fotos no existe: {$absolutePath}");
            return 1;
        }

        $cuenta = Cuenta::find($cuentaId);
        if (!$cuenta) {
            $this->error("La cuenta con ID {$cuentaId} no existe.");
            return 1;
        }

        if ($dryRun) {
            $this->warn("MODO SIMULACIÓN (DRY RUN): No se realizarán cambios físicos ni en la base de datos.");
        }

        $this->info("Importando fotos para la cuenta: {$cuenta->nombre}");

        // Escanear carpeta y crear diccionario de archivos
        $files = File::files($absolutePath);
        $fileDictionary = [];
        $totalFiles = count($files);
        
        $this->info("Escaneando {$totalFiles} archivos en {$folder}...");

        foreach ($files as $file) {
            $filename = pathinfo($file->getFilename(), PATHINFO_FILENAME);
            $cleanName = ltrim($filename, '0');
            if ($cleanName === '' && $filename !== '') {
                $cleanName = '0';
            }
            
            $fileDictionary[strtolower($cleanName)][] = $file;
        }

        $referencias = Referencia::where('cuenta_id', $cuentaId)->get();
        $this->info("Procesando " . $referencias->count() . " referencias de la base de datos...");

        $successCount = 0;
        $notFoundCount = 0;

        $bar = $this->output->createProgressBar($referencias->count());
        $bar->start();

        foreach ($referencias as $referencia) {
            $codigo = (string)$referencia->codigo;
            $cleanCodigo = ltrim($codigo, '0');
            if ($cleanCodigo === '' && $codigo !== '') {
                $cleanCodigo = '0';
            }
            $cleanCodigo = strtolower($cleanCodigo);

            if (isset($fileDictionary[$cleanCodigo])) {
                $file = $fileDictionary[$cleanCodigo][0];
                $extension = strtolower($file->getExtension());
                
                $targetName = "{$codigo}.{$extension}";
                $targetSubDir = "referencias/{$cuentaId}";
                $targetPath = "{$targetSubDir}/{$targetName}";

                if (!$dryRun) {
                    if (!Storage::disk('public')->exists($targetSubDir)) {
                        Storage::disk('public')->makeDirectory($targetSubDir);
                    }
                    
                    File::copy($file->getRealPath(), Storage::disk('public')->path($targetPath));

                    $referencia->foto = $targetPath;
                    $referencia->save();
                }

                $successCount++;
            } else {
                $notFoundCount++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        
        if ($dryRun) {
            $this->info("Simulación finalizada.");
            $this->info("Fotos que se habrían vinculado: {$successCount}");
        } else {
            $this->info("Proceso completado.");
            $this->info("Fotos vinculadas con éxito: {$successCount}");
        }

        if ($notFoundCount > 0) {
            $this->warn("Referencias sin foto encontrada: {$notFoundCount}");
        }

        return 0;
    }
}
