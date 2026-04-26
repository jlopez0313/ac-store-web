import JsBarcode from 'jsbarcode';

interface PrintItem {
    id: number;
    producto: {
        codigo: string;
        descripcion: string;
        marca: string;
    };
    estanteria_nombre: string;
    bodega_nombre: string;
    talla: string;
    cantidad: number;
}

interface PrintData {
    facturaId: number;
    localName: string;
    items: PrintItem[];
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

function buildTicketHtml(item: PrintItem, facturaId: number, localName: string, footer: string): string {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO');
    const hora = now.toLocaleTimeString('es-CO');
    const barcodeSvg = generateBarcodeSvg(item.producto.codigo);

    return `
        <div class="ticket">
            <table class="top-row">
                <tr>
                    <td class="col-ref"><b>REF ${item.producto.codigo}</b></td>
                    <td class="col-est"><b>EST ${item.estanteria_nombre.substring(0, 6)}</b></td>
                    <td class="col-fac"><b>FAC ${facturaId}</b></td>
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
            <table class="bottom-row">
                <tr>
                    <td class="col-marca">${item.producto.marca}</td>
                    <td class="col-bodega">${item.bodega_nombre}</td>
                </tr>
            </table>
            <table class="info-row">
                <tr>
                    <td class="col-local">
                        <div>${localName}</div>
                        <div>${fecha}</div>
                        <div>${hora}</div>
                    </td>
                    <td class="col-barcode">
                        ${barcodeSvg ? `<div class="barcode-wrap">${barcodeSvg}</div>` : ''}
                        <div class="barcode-code">${item.producto.codigo}</div>
                    </td>
                </tr>
            </table>
            <div class="footer-banner">RECOGER MUESTRA</div>
            <div class="footer-text">${footer}</div>
        </div>
    `;
}

const TICKET_CSS = `
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
        table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        td, th { overflow: hidden; word-break: break-word; }
        .top-row .col-ref  { width: 40%; font-size: 10px; }
        .top-row .col-est  { width: 30%; font-size: 10px; text-align: center; }
        .top-row .col-fac  { width: 30%; font-size: 10px; text-align: right; }
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
        .items-table th.col-desc  { text-align: center; }
        .items-table th.col-talla { text-align: right; }
        .values td { padding: 3px 0; font-weight: bold; }
        .values .col-cant  { font-size: 16px; }
        .values .col-desc  { font-size: 11px; text-align: center; line-height: 1.3; }
        .values .col-talla { font-size: 16px; text-align: right; }
        .bottom-row { margin-top: 4px; font-size: 11px; font-weight: bold; }
        .bottom-row .col-marca  { width: 50%; }
        .bottom-row .col-bodega { width: 50%; text-align: right; }
        .info-row { margin-top: 6px; }
        .info-row .col-local  { width: 45%; font-size: 10px; font-weight: bold; vertical-align: bottom; }
        .info-row .col-barcode { width: 55%; text-align: right; vertical-align: bottom; }
        .barcode-wrap svg { width: 100%; height: auto; display: block; }
        .barcode-code {
            font-size: 9px;
            font-family: 'Courier New', monospace;
            text-align: center;
            letter-spacing: 1px;
            margin-top: 1px;
        }
        .footer-banner {
            margin-top: 6px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 3px 0;
            letter-spacing: 1px;
        }
        .footer-text {
            margin-top: 3px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            padding-bottom: 3px;
        }
`;

function wrapHtml(bodyContent: string, title = 'Ticket'): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>${TICKET_CSS}</style>
</head>
<body onload="window.print()">
    ${bodyContent}
</body>
</html>`;
}

/** Returns one full HTML document per item — use for QZ so each item = one print job + one cut */
export function buildReceiptPageHtml(data: PrintData): string[] {
    const footer = data.footer || import.meta.env.VITE_APP_NAME || ' / WhatsApp / 300 000 0000';
    return data.items.map((item) =>
        wrapHtml(buildTicketHtml(item, data.facturaId, data.localName, footer))
    );
}

export function printReceipts(data: PrintData, returnHtml = false): string | void {
    const footer = data.footer || import.meta.env.VITE_APP_NAME || ' / WhatsApp / 300 000 0000';
    const ticketsHtml = data.items.map((item) => buildTicketHtml(item, data.facturaId, data.localName, footer)).join('');

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
