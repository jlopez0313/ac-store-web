<?php

use App\Http\Controllers\ComprasController;
use App\Http\Controllers\CuentasController;
use App\Http\Controllers\DevolucionesController;
use App\Http\Controllers\MuestrasController;
use App\Http\Controllers\ProveedoresController;
use App\Http\Controllers\ReferenciasController;
use App\Http\Controllers\UsuariosController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('referencias', ReferenciasController::class);
    Route::resource('cuentas', CuentasController::class);
    Route::get('usuarios', [UsuariosController::class, 'index'])->name('usuarios.index');
    Route::get('/muestras', [App\Http\Controllers\MuestrasController::class, 'index'])->name('muestras.index');
    Route::get('/cambios', [App\Http\Controllers\CambiosController::class, 'index'])->name('cambios.index');
    Route::get('bodegas', [App\Http\Controllers\BodegasController::class, 'index'])->name('bodegas.index');
    Route::get('bodegas/{bodega}/accesos', [App\Http\Controllers\BodegaAccesoController::class, 'index'])->name('bodegas.accesos');
    Route::post('bodegas/{bodega}/accesos/{user_id}', [App\Http\Controllers\BodegaAccesoController::class, 'update'])->name('bodegas.accesos.update');

    // Gestión de Estanterías
    Route::get('bodegas/{bodega}/estanterias', [App\Http\Controllers\EstanteriasController::class, 'index'])->name('bodegas.estanterias.index');
    Route::post('bodegas/{bodega}/estanterias', [App\Http\Controllers\EstanteriasController::class, 'store'])->name('bodegas.estanterias.store');
    Route::put('bodegas/{bodega}/estanterias/{estanteria}', [App\Http\Controllers\EstanteriasController::class, 'update'])->name('bodegas.estanterias.update');
    Route::delete('bodegas/{bodega}/estanterias/{estanteria}', [App\Http\Controllers\EstanteriasController::class, 'destroy'])->name('bodegas.estanterias.destroy');
    Route::get('categorias', [App\Http\Controllers\CategoriasController::class, 'index'])->name('categorias.index');
    Route::resource('marcas', App\Http\Controllers\MarcasController::class)->only(['index']);
    Route::group(['prefix' => 'api', 'as' => 'api.'], function () {
        Route::resource('marcas', App\Http\Controllers\Api\MarcasController::class)->only(['show', 'store', 'update', 'destroy']);
    });
    Route::resource('proveedores', ProveedoresController::class)->only(['index']);
    Route::get('traslados', [App\Http\Controllers\TrasladosController::class, 'index'])->name('traslados.index');
    Route::post('traslados', [App\Http\Controllers\TrasladosController::class, 'store'])->name('traslados.store');
    Route::get('api/traslados/referencias', [App\Http\Controllers\TrasladosController::class, 'getReferenciasByCuenta'])->name('api.traslados.referencias');
    Route::get('api/traslados/bodegas', [App\Http\Controllers\TrasladosController::class, 'getBodegasByCuenta'])->name('api.traslados.bodegas');
    Route::get('api/traslados/estanterias', [App\Http\Controllers\TrasladosController::class, 'getEstanteriasByBodega'])->name('api.traslados.estanterias');
    Route::get('api/traslados/inventory', [App\Http\Controllers\TrasladosController::class, 'getInventoryByReference'])->name('api.traslados.inventory');

    Route::get('compras', [ComprasController::class, 'index'])->name('compras.index');
    Route::get('inventario', [App\Http\Controllers\InventariosController::class, 'index'])->name('inventario.index');
    Route::get('api/inventario/{referencia}/detail', [App\Http\Controllers\InventariosController::class, 'detail'])->name('api.inventario.detail');
    Route::get('cajas', [App\Http\Controllers\CajasController::class, 'index'])->name('cajas.index');
    Route::post('cajas/{caja}/tallar', [App\Http\Controllers\CajasController::class, 'tallar'])->name('cajas.tallar');

    Route::resource('ventas', App\Http\Controllers\VentasController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('api/ventas/{venta}/detalles', [App\Http\Controllers\VentasController::class, 'addDetail'])->name('api.ventas.detalles.add');
    Route::put('api/ventas/{venta}/detalles/{detalle}', [App\Http\Controllers\VentasController::class, 'updateDetail'])->name('api.ventas.detalles.update');
    Route::delete('api/ventas/{venta}/detalles/bulk', [App\Http\Controllers\VentasController::class, 'bulkDeleteDetails'])->name('api.ventas.detalles.bulk_delete');
    Route::delete('api/ventas/{venta}/detalles/{detalle}', [App\Http\Controllers\VentasController::class, 'deleteDetail'])->name('api.ventas.detalles.delete');
    Route::get('/devoluciones', [DevolucionesController::class, 'index'])->name('devoluciones.index');
    Route::get('/muestras', [MuestrasController::class, 'index'])->name('muestras.index');
    
    // Rutas de Geografía (para Selects)
    Route::get('/api/geography/countries', [App\Http\Controllers\UsuariosController::class, 'getCountries'])->name('api.geography.countries');
    Route::get('/api/geography/states', [App\Http\Controllers\UsuariosController::class, 'getStates'])->name('api.geography.states');
    Route::get('/api/geography/cities', [App\Http\Controllers\UsuariosController::class, 'getCities'])->name('api.geography.cities');

    // Rutas de Facturas
    Route::get('/facturas', [App\Http\Controllers\FacturasController::class, 'index'])->name('facturas.index');
    Route::get('/reporte-facturas', [App\Http\Controllers\FacturasController::class, 'index'])->name('facturas.reporte');
    Route::get('/cartera', [App\Http\Controllers\CarteraController::class, 'index'])->name('cartera.index');
    Route::get('/cardex', [App\Http\Controllers\CardexController::class, 'index'])->name('cardex.index');
    Route::delete('/facturas/{factura}', [App\Http\Controllers\FacturasController::class, 'destroy'])->name('facturas.destroy');
    Route::post('api/ventas/{venta}/bulk-discounts', [App\Http\Controllers\VentasController::class, 'updateBulkDiscounts'])->name('api.ventas.bulk_discounts');
    Route::post('api/ventas/{venta}/cerrar', [App\Http\Controllers\VentasController::class, 'closeVenta'])->name('api.ventas.cerrar');
    Route::get('api/inventario/stock', [App\Http\Controllers\VentasController::class, 'getStock'])->name('api.inventario.stock');
    Route::post('api/ventas/{venta}/detalles', [App\Http\Controllers\VentasController::class, 'addDetail'])->name('api.ventas.detalles');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
