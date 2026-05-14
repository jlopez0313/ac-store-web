import { type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildReceiptPageHtml, printReceipts } from '@/utils/printReceipt';
import { printWithQZ } from '@/utils/qz-service';
import axios from 'axios';

export async function handlePrintTraslado(request: PrintRequest, auth: any) {
    const res = await axios.get(route('api.traslados.show', { traslado: request.traslado_id }));
    const traslado = res.data.data;

    if (!traslado) {
        showAlert('error', 'No se encontró el traslado.');
        return;
    }

    const printData = {
        facturaId: `TR-${traslado.id}`,
        localName: traslado.bodega_destino,
        items: [
            {
                id: traslado.id,
                producto: {
                    codigo: traslado.referencia_codigo,
                    descripcion: traslado.referencia_descripcion,
                    marca: traslado.referencia_marca,
                },
                estanteria_nombre: traslado.estanteria_destino,
                bodega_nombre: traslado.bodega_destino,
                talla: traslado.talla,
                cantidad: traslado.cantidad,
                is_traslado: true,
            },
        ],
    };

    if (auth.user.impresion_principal && auth.user.nombre_impresora) {
        const pages = buildReceiptPageHtml(printData);
        for (const page of pages) {
            await printWithQZ(auth.user.nombre_impresora, page);
        }
    } else {
        printReceipts(printData);
    }
}
