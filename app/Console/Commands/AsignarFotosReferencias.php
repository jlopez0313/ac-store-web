<?php

namespace App\Console\Commands;

use App\Models\Referencia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AsignarFotosReferencias extends Command
{
    protected $signature = 'referencias:asignar-fotos {cuenta_id}';
    protected $description = 'Asigna fotos a referencias buscando en storage/app/public/referencias/{cuenta_id}';

    public function handle()
    {
        $cuentaId = $this->argument('cuenta_id');
        $dir = "referencias/{$cuentaId}";

        if (!Storage::disk('public')->exists($dir)) {
            $this->error("No existe el directorio: storage/app/public/{$dir}");
            return 1;
        }

        $files = Storage::disk('public')->files($dir);
        $extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        $updated = 0;
        $notFound = 0;
        $skipped = 0;

        foreach ($files as $file) {
            $filename = pathinfo($file, PATHINFO_FILENAME);
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

            if (!in_array($ext, $extensions)) {
                continue;
            }

            $ref = Referencia::where('cuenta_id', $cuentaId)
                ->where('codigo', $filename)
                ->first();

            if (!$ref) {
                $notFound++;
                $this->line("<comment>No encontrada referencia con código: {$filename}</comment>");
                continue;
            }

            if ($ref->foto) {
                $skipped++;
                continue;
            }

            $ref->update(['foto' => $file]);
            $updated++;
        }

        $this->info("Proceso completado:");
        $this->line("  Asignadas: {$updated}");
        $this->line("  Ya tenían foto: {$skipped}");
        $this->line("  Sin referencia: {$notFound}");
        $this->line("  Total archivos: " . count($files));

        return 0;
    }
}
