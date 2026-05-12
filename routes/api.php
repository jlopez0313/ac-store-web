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
use App\Http\Controllers\Api\ScheduledMessageController as ApiScheduledMessageController;
use App\Http\Controllers\Api\ProfileController as ApiProfileController;
use App\Http\Controllers\Api\VideoController as ApiVideoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Profile & Account
    Route::get('profile', [ApiProfileController::class, 'index'])->name('api.profile');
    Route::post('profile', [ApiProfileController::class, 'update'])->name('api.profile.update');

    // Notifications
    Route::get('notifications', [App\Http\Controllers\Api\NotificationController::class, 'index'])->name('api.notifications.index');
    Route::post('notifications/{notification}/read', [App\Http\Controllers\Api\NotificationController::class, 'markAsRead'])->name('api.notifications.read');
    Route::post('notifications/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead'])->name('api.notifications.read_all');
    Route::post('notifications/broadcast', [App\Http\Controllers\Api\NotificationController::class, 'store'])->name('api.notifications.broadcast')->middleware('role:superadmin|admin');
    Route::get('announcements', [App\Http\Controllers\Api\NotificationController::class, 'announcementsIndex'])->name('api.announcements.index')->middleware('role:superadmin|admin');
    Route::get('announcements/{announcement}/stats', [App\Http\Controllers\Api\NotificationController::class, 'announcementStats'])->name('api.announcements.stats')->middleware('role:superadmin|admin');

    // Videos
    Route::apiResource('videos', ApiVideoController::class)->names('api.videos');

    // -------------------------------------------------------------------------
    // PUBLIC / SHARED API ROUTES (Authenticated)
    // -------------------------------------------------------------------------
    Route::get('referencias/list', [ApiReferenciasController::class, 'getList'])->name('api.referencias.list');
    Route::post('referencias/search', [ApiReferenciaSearchController::class, 'index'])->name('api.referencias.search');
    Route::get('inventario', [ApiInventariosController::class, 'index'])->name('api.inventario.index');
    Route::get('inventario/{referencia}/detail', [ApiInventariosController::class, 'detail'])->name('api.inventario.detail');
    Route::get('inventario/stock', [App\Http\Controllers\VentasController::class, 'getStock'])->name('api.inventario.stock');
    Route::get('search-references', [App\Http\Controllers\Api\VentasController::class, 'searchReferences'])->name('api.ventas.search_references');
    Route::get('bodegas/list', [App\Http\Controllers\Api\BodegasController::class, 'getList'])->name('api.bodegas.list');
    
    // Scheduled Messages (WhatsApp)
    Route::apiResource('scheduled-messages', ApiScheduledMessageController::class)->names('api.scheduled');

    // Geography
    Route::prefix('geography')->group(function () {
        Route::get('countries', [App\Http\Controllers\UsuariosController::class, 'getCountries'])->name('api.geography.countries');
        Route::get('states', [App\Http\Controllers\UsuariosController::class, 'getStates'])->name('api.geography.states');
        Route::get('cities', [App\Http\Controllers\UsuariosController::class, 'getCities'])->name('api.geography.cities');
    });

    // QZ Tray
    Route::post('qz/sign', [App\Http\Controllers\Api\QzController::class, 'sign'])->name('api.qz.sign');
    Route::get('qz/certificate', [App\Http\Controllers\Api\QzController::class, 'getCertificate'])->name('api.qz.certificate');

    // Ventas (Accessible by locals for their own operations)
    Route::apiResource('ventas', App\Http\Controllers\Api\VentasController::class)->names('api.ventas')->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::get('ventas/{venta}/detalles', [App\Http\Controllers\Api\VentasController::class, 'getDetails'])->name('api.ventas.detalles');
    Route::get('ventas/{venta}/devoluciones', [App\Http\Controllers\Api\VentasController::class, 'getReturns'])->name('api.ventas.devoluciones');
    Route::post('ventas/{venta}/detalles', [App\Http\Controllers\Api\VentasController::class, 'addDetail'])->name('api.ventas.detalles.add');
    Route::put('ventas/{venta}/detalles/{detalle}', [App\Http\Controllers\Api\VentasController::class, 'updateDetail'])->name('api.ventas.detalles.update');
    Route::delete('ventas/{venta}/detalles/bulk', [App\Http\Controllers\Api\VentasController::class, 'bulkDeleteDetails'])->name('api.ventas.detalles.bulk_delete');
    Route::delete('ventas/{venta}/detalles/{detalle}', [App\Http\Controllers\Api\VentasController::class, 'deleteDetail'])->name('api.ventas.detalles.delete');
    Route::post('ventas/{venta}/bulk-discounts', [App\Http\Controllers\Api\VentasController::class, 'updateBulkDiscounts'])->name('api.ventas.bulk_discounts');
    Route::post('ventas/{venta}/reabrir', [App\Http\Controllers\Api\VentasController::class, 'reopenVenta'])->name('api.ventas.reopen');
    Route::post('ventas/{venta}/cerrar', [App\Http\Controllers\Api\VentasController::class, 'closeVenta'])->name('api.ventas.cerrar');
    Route::post('ventas/{venta}/mark-printed', [App\Http\Controllers\Api\VentasController::class, 'markPrinted'])->name('api.ventas.mark_printed');
    Route::post('ventas/{venta}/observaciones', [App\Http\Controllers\Api\VentasController::class, 'updateObservaciones'])->name('api.ventas.update_observaciones');
    Route::get('ventas-locales', [App\Http\Controllers\Api\VentasController::class, 'getLocalesWithInvoices'])->name('api.ventas.locales_with_invoices');
    Route::apiResource('vendedores', App\Http\Controllers\Api\VendedorController::class)->names('api.vendedores');

    // -------------------------------------------------------------------------
    // SUPERADMIN & ADMIN ONLY
    // -------------------------------------------------------------------------
    Route::middleware(['role:superadmin|admin'])->group(function () {
        Route::get('cuentas/list', [ApiCuentasController::class, 'getList'])->name('api.cuentas.list');
        Route::apiResource('cuentas', ApiCuentasController::class)->names('api.cuentas');
        Route::get('usuarios/{usuario}/accesos', [ApiUsuariosController::class, 'getAccesos'])->name('api.usuarios.accesos');
        Route::post('usuarios/{usuario}/register-payment', [ApiUsuariosController::class, 'registerPayment'])->name('api.usuarios.register_payment');
        Route::apiResource('usuarios', ApiUsuariosController::class)->names('api.usuarios');
        
        // Superadmin only subscription management
        Route::middleware(['role:superadmin'])->group(function () {
            Route::get('usuarios/{usuario}/subscription-detail', [ApiUsuariosController::class, 'getSubscriptionDetail'])->name('api.usuarios.subscription_detail');
            Route::post('usuarios/{usuario}/account-price', [ApiUsuariosController::class, 'updateAccountPrice'])->name('api.usuarios.account_price');
        });
        
        Route::post('referencias/bulk-photos/chunk', [App\Http\Controllers\Api\ReferenciaFotoController::class, 'uploadChunk'])->name('api.referencias.bulk-photos.chunk');
        Route::post('referencias/bulk-photos/process', [App\Http\Controllers\Api\ReferenciaFotoController::class, 'processZip'])->name('api.referencias.bulk-photos.process');
        
        Route::prefix('subscriptions-report')->group(function () {
            Route::get('stats', [App\Http\Controllers\Api\SubscriptionsReportController::class, 'stats'])->name('api.subscriptions.stats');
            Route::get('data', [App\Http\Controllers\Api\SubscriptionsReportController::class, 'getData'])->name('api.subscriptions.data');
        });
    });

    // -------------------------------------------------------------------------
    // SUPERADMIN, ADMIN & BODEGA
    // -------------------------------------------------------------------------
    Route::middleware(['role:superadmin|admin|bodega'])->group(function () {
        Route::apiResource('bodegas', ApiBodegasController::class)->names('api.bodegas');
        Route::get('bodegas/{bodega}/accesos', [App\Http\Controllers\Api\BodegasController::class, 'getAccesos'])->name('api.bodegas.accesos');
        Route::apiResource('categorias', ApiCategoriasController::class)->names('api.categorias');
        Route::get('referencias/next-code', [ApiReferenciasController::class, 'getNextCode'])->name('api.referencias.next-code');
        Route::apiResource('referencias', ApiReferenciasController::class)->names('api.referencias');
        Route::apiResource('marcas', App\Http\Controllers\Api\MarcasController::class)->names('api.marcas');
        Route::apiResource('proveedores', ApiProveedoresController::class)->names('api.proveedores');
        Route::apiResource('compras', ApiComprasController::class)->names('api.compras');
        Route::post('compras/{compra}/detalles', [App\Http\Controllers\Api\CompraDetallesController::class, 'store'])->name('api.compra_detalles.store');
        Route::delete('compras/{compra}/detalles/{detalle}', [App\Http\Controllers\Api\CompraDetallesController::class, 'destroy'])->name('api.compra_detalles.destroy');

        Route::get('inventario/export-csv', [ApiInventariosController::class, 'exportCsv'])->name('api.inventario.export-csv');
        Route::get('inventario/ajustes', [App\Http\Controllers\Api\AjustesReportController::class, 'index'])->name('api.inventario.ajustes');
        Route::post('inventario/ajustar', [App\Http\Controllers\InventariosController::class, 'ajustar'])->name('api.inventario.ajustar');

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

        // Stickers / Etiquetas
        Route::get('stickers', [App\Http\Controllers\Api\StickersController::class, 'index'])->name('api.stickers.index');
        Route::post('stickers', [App\Http\Controllers\Api\StickersController::class, 'store'])->name('api.stickers.store');
        Route::post('stickers/mark-printed', [App\Http\Controllers\Api\StickersController::class, 'markAsPrinted'])->name('api.stickers.mark_printed');
    });

    // Operaciones y Reportes (Accesibles por todos los roles autorizados, incluyendo locales)
    Route::middleware(['role:superadmin|admin|bodega|local'])->group(function () {
        // Cambios y Devoluciones
        Route::get('cambios', [App\Http\Controllers\Api\CambiosController::class, 'index'])->name('api.cambios.index');
        Route::get('cambios/invoices', [App\Http\Controllers\CambiosController::class, 'getClosedInvoices'])->name('api.cambios.invoices');
        Route::get('cambios/invoice-details', [App\Http\Controllers\CambiosController::class, 'getInvoiceDetails'])->name('api.cambios.invoice_details');
        Route::post('cambios', [App\Http\Controllers\CambiosController::class, 'store'])->name('api.cambios.store');
        Route::get('devoluciones', [App\Http\Controllers\Api\DevolucionesController::class, 'index'])->name('api.devoluciones.index');

        // Otros Reportes
        Route::get('facturas', [App\Http\Controllers\Api\FacturasController::class, 'index'])->name('api.facturas.index');
        Route::get('cartera', [App\Http\Controllers\Api\CarteraController::class, 'index'])->name('api.cartera.index');
        Route::get('cardex', [App\Http\Controllers\Api\CardexController::class, 'index'])->name('api.cardex.index');
        Route::get('cajas', [App\Http\Controllers\Api\CajasController::class, 'index'])->name('api.cajas.index');
        Route::get('reportes/ventas', [App\Http\Controllers\Api\ReportesController::class, 'ventas'])->name('api.reportes.ventas');
    });
});
