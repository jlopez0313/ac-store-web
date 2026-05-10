<?php

use App\Http\Controllers\ComprasController;
use App\Http\Controllers\CuentasController;
use App\Http\Controllers\DevolucionesController;
use App\Http\Controllers\ImportacionController;
use App\Http\Controllers\MuestrasController;
use App\Http\Controllers\ProveedoresController;
use App\Http\Controllers\ReferenciasController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\WhatsappController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    // Access for everyone authenticated
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('referencias', ReferenciasController::class);
    Route::get('referencias-busqueda', [App\Http\Controllers\ReferenciaSearchController::class, 'index'])->name('referencias.search');
    Route::get('vendedores', [App\Http\Controllers\VendedorController::class, 'all'])->name('vendedores.index');
    Route::get('inventario', [App\Http\Controllers\InventariosController::class, 'index'])->name('inventario.index');
    Route::get('/reporte-facturas', [App\Http\Controllers\FacturasController::class, 'index'])->name('facturas.reporte');
    Route::resource('ventas', App\Http\Controllers\VentasController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('whatsapp', [WhatsappController::class, 'index'])->name('whatsapp.index');

    // ONLY Superadmin & Admin
    Route::middleware(['role:superadmin|admin'])->group(function () {
        Route::resource('cuentas', CuentasController::class);
        Route::get('usuarios', [App\Http\Controllers\UsuariosController::class, 'index'])->name('usuarios.index');
        Route::get('usuarios/{usuario}/accesos', [App\Http\Controllers\UsuarioAccesoController::class, 'index'])->name('usuarios.accesos');
        Route::get('usuarios/{usuario}/vendedores', [App\Http\Controllers\VendedorController::class, 'index'])->name('usuarios.vendedores');
        Route::post('usuarios/{usuario}/accesos/{bodega_id}', [App\Http\Controllers\UsuarioAccesoController::class, 'update'])->name('usuarios.accesos.update');
        Route::get('opciones', [App\Http\Controllers\OpcionesController::class, 'index'])->name('opciones.index');
        Route::get('opciones/horarios', [App\Http\Controllers\OpcionesController::class, 'horarios'])->name('opciones.horarios');
        Route::put('opciones/horarios', [App\Http\Controllers\OpcionesController::class, 'updateHorarios'])->name('opciones.horarios.update');
        Route::get('reporte-suscripciones', [App\Http\Controllers\SuscripcionesController::class, 'index'])->name('subscriptions.report');
        
        Route::prefix('importar')->name('importar.')->group(function () {
            Route::get('/', [ImportacionController::class, 'index'])->name('index');
            Route::post('/chunk', [ImportacionController::class, 'chunk'])->name('chunk');
            Route::post('/chunk-csv', [ImportacionController::class, 'chunkCsv'])->name('chunkCsv');
            Route::post('/ejecutar', [ImportacionController::class, 'ejecutar'])->name('ejecutar');
            Route::get('/progreso', [ImportacionController::class, 'progreso'])->name('progreso');
        });
        Route::get('referencias-bulk-photos', [ReferenciasController::class, 'bulkPhotos'])->name('referencias.bulk-photos');
    });

    // Superadmin, Admin & Bodega (Internal Operations)
    Route::middleware(['role:superadmin|admin|bodega'])->group(function () {
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
        Route::resource('marcas', App\Http\Controllers\MarcasController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('proveedores', ProveedoresController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('traslados', [App\Http\Controllers\TrasladosController::class, 'index'])->name('traslados.index');
        Route::post('traslados', [App\Http\Controllers\TrasladosController::class, 'store'])->name('traslados.store');

        Route::get('compras', [ComprasController::class, 'index'])->name('compras.index');
        Route::get('inventario/ajustes', [App\Http\Controllers\AjusteInventarioController::class, 'index'])->name('inventario.ajustes');
        Route::get('cajas', [App\Http\Controllers\CajasController::class, 'index'])->name('cajas.index');
        Route::post('cajas/{caja}/tallar', [App\Http\Controllers\CajasController::class, 'tallar'])->name('cajas.tallar');

        Route::get('/devoluciones', [DevolucionesController::class, 'index'])->name('devoluciones.index');
        Route::get('/facturas', [App\Http\Controllers\FacturasController::class, 'index'])->name('facturas.index');
        Route::get('/reporte-ventas', [App\Http\Controllers\ReportesController::class, 'ventas'])->name('reportes.ventas');
        Route::get('/cartera', [App\Http\Controllers\CarteraController::class, 'index'])->name('cartera.index');
        Route::get('/cardex', [App\Http\Controllers\CardexController::class, 'index'])->name('cardex.index');
        Route::delete('/facturas/{factura}', [App\Http\Controllers\FacturasController::class, 'destroy'])->name('facturas.destroy');
    });

    Route::get('descargar-etiqueta/{id}', [App\Http\Controllers\Api\InventariosController::class, 'downloadLabel'])->name('etiquetas.descargar');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
