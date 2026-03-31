<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class ImageCompressionService
{
    /**
     * Comprime un archivo local si supera los 800KB.
     *
     * @param string $imagePath Ruta absoluta del archivo local.
     * @param string $savePath Directorio destino en el disco 'public' (ej. 'referencias').
     * @param string $filename Nombre opcional (sin extensión).
     * @return string|null Ruta relativa guardada o null si falla.
     */
    public function compressImageFromPath(string $imagePath, string $savePath, string $filename = "")
    {
        if (!file_exists($imagePath)) return null;

        $sizeInKB = filesize($imagePath) / 1024;
        $extension = pathinfo($imagePath, PATHINFO_EXTENSION) ?: 'jpg';
        $filename = ($filename ? "{$filename}.{$extension}" : uniqid() . "_compressed.{$extension}");
        
        $relativePath = trim($savePath, '/') . '/' . $filename;
        $this->ensureDirectoryExists($savePath);

        if ($sizeInKB > 800) {
            $manager = ImageManager::gd();
            $manager->read($imagePath)
                ->scale(width: 800)
                ->save(Storage::disk('public')->path($relativePath), 80);
        } else {
            Storage::disk('public')->put($relativePath, file_get_contents($imagePath));
        }

        return $relativePath;
    }

    /**
     * Comprime un archivo subido a través de una petición HTTP (UploadedFile).
     *
     * @param UploadedFile $image Archivo subido.
     * @param string $path Directorio destino en el disco 'public' (ej. 'referencias').
     * @param string $filename Nombre opcional (sin extensión).
     * @return string Ruta relativa (ej. 'referencias/123.jpg').
     */
    public function compressImage(UploadedFile $image, string $path, string $filename = "")
    {
        $extension = $image->getClientOriginalExtension() ?: 'jpg';
        $filename = ($filename ? "{$filename}.{$extension}" : uniqid() . "_compressed.{$extension}");
        $relativePath = trim($path, '/') . '/' . $filename;
        $sizeInKB = $image->getSize() / 1024;

        $this->ensureDirectoryExists($path);

        if ($sizeInKB > 800) {
            $manager = ImageManager::gd();
            $manager->read($image->getRealPath())
                ->scale(width: 800)
                ->save(Storage::disk('public')->path($relativePath), 80);
        } else {
            Storage::disk('public')->put($relativePath, file_get_contents($image->getRealPath()));
        }

        return $relativePath;
    }

    /**
     * Comprime y guarda una imagen desde una cadena base64.
     *
     * @param string $image_64 Imagen en formato base64.
     * @param string $path Directorio destino en el disco 'public'.
     * @param string $filename Nombre opcional (sin extensión).
     * @return string Ruta relativa guardada.
     */
    public function compressBase64(string $image_64, string $path, string $filename = "")
    {
        // Extract extension and binary data from base64 string
        preg_match('/^data:image\/(\w+);base64,/', $image_64, $type);
        $extension = strtolower($type[1] ?? 'png'); // Default to png if missing
        
        $imageBinary = base64_decode(preg_replace('/^data:image\/\w+;base64,/', '', $image_64));
        $sizeInKB = strlen($imageBinary) / 1024;

        $filename = ($filename ? "{$filename}.{$extension}" : uniqid() . "_compressed.{$extension}");
        $relativePath = trim($path, '/') . '/' . $filename;
        
        $this->ensureDirectoryExists($path);

        if ($sizeInKB > 800) {
            $manager = ImageManager::gd();
            $manager->read($imageBinary)
                ->scale(width: 800)
                ->save(Storage::disk('public')->path($relativePath), 80);
        } else {
            Storage::disk('public')->put($relativePath, $imageBinary);
        }

        return $relativePath;
    }

    /**
     * Asegura que el directorio exista en el disco público.
     */
    private function ensureDirectoryExists(string $path)
    {
        $dir = trim($path, '/');
        if (!Storage::disk('public')->exists($dir)) {
            Storage::disk('public')->makeDirectory($dir);
        }
    }
}