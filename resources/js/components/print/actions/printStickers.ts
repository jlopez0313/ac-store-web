import { removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildStickerPageHtml } from '@/utils/printStickers';
import { printWithQZ } from '@/utils/qz-service';
import axios from 'axios';

export async function handlePrintStickers(request: PrintRequest, auth: any, effectiveCuentaId: any) {
    const response = await axios.get(route('api.stickers.index'), {
        params: { ids: request.ids || [] }
    });
    const stickers = response.data.data;

    if (!stickers || stickers.length === 0) {
        showAlert('info', 'No se encontraron etiquetas pendientes.');
        if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
        return;
    }

    if (auth.user.impresion_principal && auth.user.nombre_impresora) {
        const pages = buildStickerPageHtml(stickers);
        for (const page of pages) {
            await printWithQZ(auth.user.nombre_impresora, page);
        }
    } else {
        const pages = buildStickerPageHtml(stickers);
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(pages.join('<div style="page-break-after:always"></div>'));
            win.document.close();
        }
    }

    await axios.post(route('api.stickers.mark_printed'), {
        ids: stickers.map((s: any) => s.id)
    });
}
