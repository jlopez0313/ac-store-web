<?php

use App\Http\Controllers\Api\CuentasController as ApiCuentasController;
use App\Http\Controllers\Api\ReferenciaSearchController as ApiReferenciaSearchController;
use App\Http\Controllers\Api\UsuariosController as ApiUsuariosController;
use App\Http\Controllers\Api\InventariosController as ApiInventariosController;
use App\Http\Controllers\Api\ReferenciasController as ApiReferenciasController;
use App\Http\Controllers\Api\ProveedoresController as ApiProveedoresController;
use App\Http\Controllers\Api\ComprasController as ApiComprasController;
use App\Http\Controllers\Api\BodegasController as ApiBodegasController;
use App\Http\Controllers\Api\CategoriasController as ApiCategoriasController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Recursos Base
    Route::apiResource('cuentas', ApiCuentasController::class)->names('api.cuentas');
    Route::apiResource('usuarios', ApiUsuariosController::class)->names('api.usuarios');
    Route::apiResource('bodegas', ApiBodegasController::class)->names('api.bodegas');
    Route::get('bodegas/{bodega}/accesos', [App\Http\Controllers\Api\BodegasController::class, 'getAccesos'])->name('api.bodegas.accesos');
    Route::apiResource('categorias', ApiCategoriasController::class)->names('api.categorias');
    Route::get('referencias/next-code', [ApiReferenciasController::class, 'getNextCode'])->name('api.referencias.next-code');
    Route::post('referencias/search', [ApiReferenciaSearchController::class, 'index'])->name('api.referencias.search');
    Route::apiResource('referencias', ApiReferenciasController::class)->names('api.referencias');
    Route::apiResource('marcas', App\Http\Controllers\Api\MarcasController::class)->names('api.marcas');
    Route::apiResource('proveedores', ApiProveedoresController::class)->names('api.proveedores');
    Route::apiResource('compras', ApiComprasController::class)->names('api.compras');

    // Detalles de Compra
    Route::post('compras/{compra}/detalles', [App\Http\Controllers\Api\CompraDetallesController::class, 'store'])->name('api.compra_detalles.store');
    Route::delete('compras/{compra}/detalles/{detalle}', [App\Http\Controllers\Api\CompraDetallesController::class, 'destroy'])->name('api.compra_detalles.destroy');

    // Inventario
    Route::get('inventario', [ApiInventariosController::class, 'index'])->name('api.inventario.index');
    Route::get('inventario/export-csv', [ApiInventariosController::class, 'exportCsv'])->name('api.inventario.export-csv');
    Route::get('inventario/ajustes', [App\Http\Controllers\Api\AjustesReportController::class, 'index'])->name('api.inventario.ajustes');
    Route::post('inventario/ajustar', [App\Http\Controllers\InventariosController::class, 'ajustar'])->name('api.inventario.ajustar');
    Route::get('inventario/{referencia}/detail', [ApiInventariosController::class, 'detail'])->name('api.inventario.detail');
    Route::get('inventario/stock', [App\Http\Controllers\VentasController::class, 'getStock'])->name('api.inventario.stock'); // Consider moving to Api\VentasController

    // Ventas
    Route::apiResource('ventas', App\Http\Controllers\Api\VentasController::class)->names('api.ventas')->only(['index', 'store', 'update', 'destroy']);
    Route::get('ventas/{venta}/detalles', [App\Http\Controllers\Api\VentasController::class, 'getDetails'])->name('api.ventas.detalles');
    Route::post('ventas/{venta}/detalles', [App\Http\Controllers\Api\VentasController::class, 'addDetail'])->name('api.ventas.detalles.add');
    Route::put('ventas/{venta}/detalles/{detalle}', [App\Http\Controllers\Api\VentasController::class, 'updateDetail'])->name('api.ventas.detalles.update');
    Route::delete('ventas/{venta}/detalles/bulk', [App\Http\Controllers\Api\VentasController::class, 'bulkDeleteDetails'])->name('api.ventas.detalles.bulk_delete');
    Route::delete('ventas/{venta}/detalles/{detalle}', [App\Http\Controllers\Api\VentasController::class, 'deleteDetail'])->name('api.ventas.detalles.delete');
    Route::post('ventas/{venta}/bulk-discounts', [App\Http\Controllers\Api\VentasController::class, 'updateBulkDiscounts'])->name('api.ventas.bulk_discounts');
    Route::post('ventas/{venta}/cerrar', [App\Http\Controllers\Api\VentasController::class, 'closeVenta'])->name('api.ventas.cerrar');
    Route::post('ventas/{venta}/mark-printed', [App\Http\Controllers\Api\VentasController::class, 'markPrinted'])->name('api.ventas.mark_printed');
    Route::get('search-references', [App\Http\Controllers\Api\VentasController::class, 'searchReferences'])->name('api.ventas.search_references');

    // Traslados
    Route::prefix('traslados')->group(function () {
        Route::get('referencias', [App\Http\Controllers\TrasladosController::class, 'getReferenciasByCuenta'])->name('api.traslados.referencias');
        Route::get('bodegas', [App\Http\Controllers\TrasladosController::class, 'getBodegasByCuenta'])->name('api.traslados.bodegas');
        Route::get('estanterias', [App\Http\Controllers\TrasladosController::class, 'getEstanteriasByBodega'])->name('api.traslados.estanterias');
        Route::get('inventory', [App\Http\Controllers\TrasladosController::class, 'getInventoryByReference'])->name('api.traslados.inventory');
    });

    // Muestras
    Route::get('muestras', [App\Http\Controllers\Api\MuestrasController::class, 'index'])->name('api.muestras.index');
    Route::get('muestras/references', [App\Http\Controllers\MuestrasController::class, 'getReferencesByAccount'])->name('api.muestras.references');
    Route::get('muestras/stock', [App\Http\Controllers\MuestrasController::class, 'getStock'])->name('api.muestras.stock');
    Route::apiResource('muestras-crud', App\Http\Controllers\MuestrasController::class)->names('api.muestras_crud');

    // Cambios y Devoluciones
    Route::get('cambios', [App\Http\Controllers\Api\CambiosController::class, 'index'])->name('api.cambios.index');
    Route::get('cambios/invoices', [App\Http\Controllers\CambiosController::class, 'getClosedInvoices'])->name('api.cambios.invoices');
    Route::get('cambios/invoice-details', [App\Http\Controllers\CambiosController::class, 'getInvoiceDetails'])->name('api.cambios.invoice_details');
    Route::post('cambios', [App\Http\Controllers\CambiosController::class, 'store'])->name('api.cambios.store');
    Route::get('devoluciones', [App\Http\Controllers\Api\DevolucionesController::class, 'index'])->name('api.devoluciones.index');

    // Reportes de suscripciones
    Route::prefix('subscriptions-report')->group(function () {
        Route::get('stats', [App\Http\Controllers\Api\SubscriptionsReportController::class, 'stats'])->name('api.subscriptions.stats');
        Route::get('data', [App\Http\Controllers\Api\SubscriptionsReportController::class, 'getData'])->name('api.subscriptions.data');
    });

    // Geografía
    Route::prefix('geography')->group(function () {
        Route::get('countries', [App\Http\Controllers\UsuariosController::class, 'getCountries'])->name('api.geography.countries');
        Route::get('states', [App\Http\Controllers\UsuariosController::class, 'getStates'])->name('api.geography.states');
        Route::get('cities', [App\Http\Controllers\UsuariosController::class, 'getCities'])->name('api.geography.cities');
    });

    // Otros Reportes
    Route::get('facturas', [App\Http\Controllers\Api\FacturasController::class, 'index'])->name('api.facturas.index');
    Route::get('cartera', [App\Http\Controllers\Api\CarteraController::class, 'index'])->name('api.cartera.index');
    Route::get('cardex', [App\Http\Controllers\Api\CardexController::class, 'index'])->name('api.cardex.index');
    Route::get('cajas', [App\Http\Controllers\Api\CajasController::class, 'index'])->name('api.cajas.index');

    // QZ Tray Signing
    Route::post('qz/sign', [App\Http\Controllers\Api\QzController::class, 'sign'])->name('api.qz.sign');
    Route::get('qz/certificate', [App\Http\Controllers\Api\QzController::class, 'getCertificate'])->name('api.qz.certificate');
});
