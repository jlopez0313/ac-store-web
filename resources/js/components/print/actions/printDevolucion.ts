import { removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildReturnPageHtml } from '@/utils/printReturn';
import { printWithQZ } from '@/utils/qz-service';
import axios from 'axios';

export async function handlePrintDevolucion(request: PrintRequest, auth: any, effectiveCuentaId: any) {
    const response = await axios.get(route('api.devoluciones.index'), {
        params: { ids: request.ids || [] },
    });
    const returns = response.data.data;

    if (!returns || returns.length === 0) {
        showAlert('info', 'No se encontraron los datos de la devolución.');
        if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
        return;
    }

    if (auth.user.impresion_principal && auth.user.nombre_impresora) {
        const pages = buildReturnPageHtml({
            localName: request.local_name,
            items: returns,
        });
        for (let i = 0; i < pages.length; i++) {
            await printWithQZ(auth.user.nombre_impresora, pages[i]);
        }
    } else {
        const { printReturns } = await import('@/utils/printReturn');
        printReturns({
            localName: request.local_name,
            items: returns,
        });
    }
}
