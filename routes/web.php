<?php

use App\Http\Controllers\ComprasController;
use App\Http\Controllers\CuentasController;
use App\Http\Controllers\ProveedoresController;
use App\Http\Controllers\ReferenciasController;
use App\Http\Controllers\UsuariosController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('referencias', ReferenciasController::class)->only(['index']);
    Route::resource('cuentas', CuentasController::class);
    Route::get('usuarios', [UsuariosController::class, 'index'])->name('usuarios.index');
    Route::get('bodegas', [App\Http\Controllers\BodegasController::class, 'index'])->name('bodegas.index');
    Route::get('categorias', [App\Http\Controllers\CategoriasController::class, 'index'])->name('categorias.index');
    Route::resource('proveedores', ProveedoresController::class)->only(['index']);
    Route::get('compras', [ComprasController::class, 'index'])->name('compras.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
