import { removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildReceiptPageHtml, printReceipts } from '@/utils/printReceipt';
import { printSoporteVenta } from '@/utils/printSoporteVenta';
import { printWithQZ } from '@/utils/qz-service';
import axios from 'axios';

export async function handlePrintVenta(request: PrintRequest, auth: any, effectiveCuentaId: any) {
    const response = await axios.get(route('api.ventas.show', request.venta_id));
    const venta = response.data.data;

    if (!venta) {
        showAlert('error', 'No se encontró la factura.');
        return;
    }

    const detalles = venta.detalles || [];

    if (request.type === 'pendientes') {
        const pendientes = detalles.filter((d: any) => !d.impreso);
        if (pendientes.length === 0) {
            showAlert('info', 'No hay ítems pendientes por imprimir.');
            if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
            return;
        }

        if (auth.user.impresion_principal && auth.user.nombre_impresora) {
            const pages = buildReceiptPageHtml({
                facturaId: venta.id,
                localName: venta.local?.name || '',
                items: pendientes,
            });
            for (let i = 0; i < pages.length; i++) {
                const item = pendientes[i];
                await printWithQZ(auth.user.nombre_impresora, pages[i]);
                await axios.post(route('api.ventas.mark_printed', venta.id), {
                    detalle_ids: [item.id],
                });
            }
        } else {
            printReceipts({
                facturaId: venta.id,
                localName: venta.local?.name || '',
                items: pendientes,
            });
            await axios.post(route('api.ventas.mark_printed', venta.id), {
                detalle_ids: pendientes.map((d: any) => d.id),
            });
        }
    } else if (request.type === 'cuadre') {
        const { printCuadre } = await import('@/utils/printCuadre');
        const html = printCuadre(
            {
                facturaId: venta.id,
                localName: venta.local?.name || '',
                vendedor: venta.vendedor || '',
                items: detalles,
            },
            true,
        ) as string;

        if (auth.user.impresion_principal && auth.user.nombre_impresora) {
            await printWithQZ(auth.user.nombre_impresora, html);
        } else {
            printCuadre({
                facturaId: venta.id,
                localName: venta.local?.name || '',
                vendedor: venta.vendedor || '',
                items: detalles,
            });
        }
    } else if (request.type === 'factura') {
        const soporteData = {
            facturaId: venta.id,
            localName: venta.local?.name || '',
            vendedor: venta.vendedor || '',
            items: detalles,
        };

        if (auth.user.impresion_principal && auth.user.nombre_impresora) {
            const html = printSoporteVenta(soporteData, true) as string;
            await printWithQZ(auth.user.nombre_impresora, html);
        } else {
            printSoporteVenta(soporteData);
        }
    }
}
