import JsBarcode from 'jsbarcode';

interface ReturnItem {
    id: number;
    venta_id: number;
    producto: {
        codigo: string;
        descripcion: string;
        marca: string;
    };
    talla: string;
    cantidad: number;
    observacion?: string;
    fecha_devolucion?: string;
    eliminador?: {
        name: string;
    };
}

interface ReturnPrintData {
    localName: string;
    items: ReturnItem[];
    footer?: string;
}

function generateBarcodeSvg(value: string): string {
    try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svg, value, {
            format: 'CODE128',
            width: 1.5,
            height: 40,
            displayValue: false,
            margin: 0,
        });
        return svg.outerHTML;
    } catch {
        return '';
    }
}

function buildReturnTicketHtml(item: ReturnItem, localName: string, footer: string): string {
    const fecha = item.fecha_devolucion ? new Date(item.fecha_devolucion).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO');
    const hora = item.fecha_devolucion ? new Date(item.fecha_devolucion).toLocaleTimeString('es-CO') : new Date().toLocaleTimeString('es-CO');
    const barcodeSvg = generateBarcodeSvg(item.producto.codigo);

    return `
        <div class="ticket return-ticket">
            <div class="return-header">TICKET DE DEVOLUCIÓN</div>
            <table class="top-row">
                <tr>
                    <td class="col-ref"><b>REF ${item.producto.codigo}</b></td>
                    <td class="col-fac"><b>FAC ORIG #${item.venta_id}</b></td>
                </tr>
            </table>
            <table class="items-table">
                <thead>
                    <tr>
                        <th class="col-cant">Cant</th>
                        <th class="col-desc">Descripción</th>
                        <th class="col-talla">Talla</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="values">
                        <td class="col-cant">${item.cantidad}</td>
                        <td class="col-desc">${item.producto.descripcion}</td>
                        <td class="col-talla">${item.talla}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="reason-box">
                <div class="reason-label">MOTIVO DE DEVOLUCIÓN:</div>
                <div class="reason-text">${item.observacion || 'No especificado'}</div>
            </div>

            <table class="info-row">
                <tr>
                    <td class="col-local">
                        <div>${localName}</div>
                        <div>${fecha} ${hora}</div>
                        <div class="user-info">Por: ${item.eliminador?.name || 'Sistema'}</div>
                    </td>
                    <td class="col-barcode">
                        ${barcodeSvg ? `<div class="barcode-wrap">${barcodeSvg}</div>` : ''}
                        <div class="barcode-code">${item.producto.codigo}</div>
                    </td>
                </tr>
            </table>
            <div class="footer-banner return-banner">DEVOLUCIÓN</div>
            <div class="footer-text">${footer}</div>
        </div>
    `;
}

const RETURN_TICKET_CSS = `
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            width: 100%;
            color: #000;
        }
        .ticket {
            padding: 3mm 2mm;
            width: 100%;
            overflow: hidden;
        }
        .return-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
        }
        table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        td, th { overflow: hidden; word-break: break-word; }
        .top-row .col-ref  { width: 50%; font-size: 11px; }
        .top-row .col-fac  { width: 50%; font-size: 11px; text-align: right; }
        
        .items-table { margin-top: 4px; }
        .items-table thead th {
            font-size: 9px;
            font-weight: bold;
            border-bottom: 1px dashed #000;
            padding-bottom: 2px;
        }
        .items-table .col-cant  { width: 20%; }
        .items-table .col-desc  { width: 55%; text-align: center; }
        .items-table .col-talla { width: 25%; text-align: right; }
        
        .values td { padding: 3px 0; font-weight: bold; }
        .values .col-cant  { font-size: 16px; }
        .values .col-desc  { font-size: 11px; text-align: center; line-height: 1.3; }
        .values .col-talla { font-size: 16px; text-align: right; }
        
        .reason-box {
            margin: 8px 0;
            padding: 4px;
            border: 1px solid #000;
            background: #f0f0f0;
        }
        .reason-label {
            font-size: 9px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 2px;
        }
        .reason-text {
            font-size: 11px;
            font-style: italic;
            line-height: 1.2;
        }

        .info-row { margin-top: 6px; }
        .info-row .col-local  { width: 45%; font-size: 10px; font-weight: bold; vertical-align: bottom; }
        .info-row .col-barcode { width: 55%; text-align: right; vertical-align: bottom; }
        .user-info { font-size: 9px; margin-top: 2px; color: #444; }
        
        .barcode-wrap svg { width: 100%; height: auto; display: block; }
        .barcode-code {
            font-size: 9px;
            text-align: center;
            letter-spacing: 1px;
            margin-top: 1px;
        }
        .footer-banner {
            margin-top: 6px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 3px 0;
            letter-spacing: 1px;
        }
        .return-banner {
            background-color: #000;
            color: #fff;
        }
        .footer-text {
            margin-top: 3px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            padding-bottom: 3px;
        }
`;

function wrapHtml(bodyContent: string, title = 'Ticket de Devolución'): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>${RETURN_TICKET_CSS}</style>
</head>
<body onload="window.print()">
    ${bodyContent}
</body>
</html>`;
}

/** Returns one full HTML document per item — use for QZ so each item = one print job + one cut */
export function buildReturnPageHtml(data: ReturnPrintData): string[] {
    const footer = data.footer || `${import.meta.env.VITE_APP_NAME || 'BodegaStock'} / ${import.meta.env.VITE_SUPPORT_URL || 'bodegastock.com'} / WA: ${import.meta.env.VITE_SUPPORT_WHATSAPP || '322 5086903'}`;
    return data.items.map((item) =>
        wrapHtml(buildReturnTicketHtml(item, data.localName, footer))
    );
}

export function printReturns(data: ReturnPrintData, returnHtml = false): string | void {
    const footer = data.footer || `${import.meta.env.VITE_APP_NAME || 'BodegaStock'} / ${import.meta.env.VITE_SUPPORT_URL || 'bodegastock.com'} / WA: ${import.meta.env.VITE_SUPPORT_WHATSAPP || '322 5086903'}`;
    const ticketsHtml = data.items.map((item) => buildReturnTicketHtml(item, data.localName, footer)).join('');

    const html = wrapHtml(ticketsHtml);

    if (returnHtml) {
        return html;
    }

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}
