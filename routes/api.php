<?php

use App\Http\Controllers\Api\CuentasController as ApiCuentasController;
use App\Http\Controllers\Api\UsuariosController as ApiUsuariosController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('cuentas', ApiCuentasController::class)->except(['index']);
    Route::apiResource('usuarios', ApiUsuariosController::class)->except(['index']);
    Route::apiResource('bodegas', App\Http\Controllers\Api\BodegasController::class)->except(['index']);
    Route::apiResource('categorias', App\Http\Controllers\Api\CategoriasController::class)->except(['index']);
    Route::apiResource('referencias', App\Http\Controllers\Api\ReferenciasController::class)->except(['index']);
    Route::apiResource('proveedores', App\Http\Controllers\Api\ProveedoresController::class)->except(['index']);
    Route::apiResource('compras', App\Http\Controllers\Api\ComprasController::class)->except(['index']);
    Route::post('compras/{compra}/detalles', [App\Http\Controllers\Api\CompraDetallesController::class, 'store'])->name('api.compra_detalles.store');
    Route::delete('compras/{compra}/detalles/{detalle}', [App\Http\Controllers\Api\CompraDetallesController::class, 'destroy'])->name('api.compra_detalles.destroy');
});
