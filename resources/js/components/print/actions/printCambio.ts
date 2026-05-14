import { removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildCambioPageHtml } from '@/utils/printCambio';
import { printWithQZ } from '@/utils/qz-service';
import axios from 'axios';

export async function handlePrintCambio(request: PrintRequest, auth: any, effectiveCuentaId: any) {
    const response = await axios.get(route('api.cambios.index'), {
        params: { ids: request.ids || [] },
    });
    const cambios = response.data.data;

    if (!cambios || cambios.length === 0) {
        showAlert('info', 'No se encontraron los datos del cambio.');
        if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
        return;
    }

    if (auth.user.impresion_principal && auth.user.nombre_impresora) {
        const pages = buildCambioPageHtml({
            localName: request.local_name,
            items: cambios,
        });
        for (let i = 0; i < pages.length; i++) {
            await printWithQZ(auth.user.nombre_impresora, pages[i]);
        }
    } else {
        const { printCambios } = await import('@/utils/printCambio');
        printCambios({
            localName: request.local_name,
            items: cambios,
        });
    }
}
