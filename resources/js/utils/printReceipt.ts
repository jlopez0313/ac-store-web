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

function generateBarcodeDataUrl(value: string): string {
    const canvas = document.createElement('canvas');
    try {
        JsBarcode(canvas, value, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 14,
            font: 'Courier New',
            margin: 5,
        });
        return canvas.toDataURL('image/png');
    } catch {
        return '';
    }
}

function buildTicketHtml(item: PrintItem, facturaId: number, localName: string, footer: string): string {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO');
    const hora = now.toLocaleTimeString('es-CO');
    const barcodeUrl = generateBarcodeDataUrl(item.producto.codigo);

    return `
        <div class="ticket">
            <div class="row">
                <span><b>REF ${item.producto.codigo} </b></span>
                <span><b>EST ${item.estanteria_nombre} </b></span>
                <span><b>FAC ${facturaId} </b></span>
            </div>
            <div class="row header-labels">
                <span>Cant</span>
                <span>Descripción</span>
                <span>Talla</span>
            </div>
            <div class="row values">
                <span class="cant">${item.cantidad}</span>
                <span class="desc">${item.producto.descripcion}</span>
                <span class="talla">${item.talla}</span>
            </div>
            <div class="row marca-bodega">
                <span>${item.producto.marca}</span>
                <span>${item.bodega_nombre}</span>
            </div>
            <div class="row local-info">
                <div>
                    <div>${localName}</div>
                    <div>${fecha}</div>
                    <div>${hora}</div>
                </div>
                <div class="barcode">
                    ${barcodeUrl ? `<img src="${barcodeUrl}" />` : `<span>${item.producto.codigo}</span>`}
                </div>
            </div>
            <div class="footer-banner">RECOGER MUESTRA</div>
            <div class="footer-text">${footer}</div>
        </div>
    `;
}

export function printReceipts(data: PrintData): void {
    const footer = data.footer || import.meta.env.VITE_APP_NAME || ' / WhatsApp / 300 000 0000';
    const ticketsHtml = data.items.map((item) => buildTicketHtml(item, data.facturaId, data.localName, footer)).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Imprimir Tickets</title>
    <style>
        @page {
            margin: 0;
            size: 80mm auto;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            color: #000;
        }
        .ticket {
            padding: 4mm 3mm;
            page-break-after: always;
            width: 80mm;
        }
        .ticket:last-child {
            page-break-after: auto;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
        .row b {
            font-size: 11px;
        }
        .header-labels {
            margin-top: 6px;
            font-size: 10px;
            font-weight: bold;
            border-bottom: 1px dashed #000;
            padding-bottom: 2px;
        }
        .header-labels span:nth-child(1) { width: 35px; }
        .header-labels span:nth-child(2) { flex: 1; text-align: center; }
        .header-labels span:nth-child(3) { width: 45px; text-align: right; }
        .values {
            font-weight: bold;
            padding: 4px 0;
        }
        .values .cant {
            width: 35px;
            font-size: 18px;
        }
        .values .desc {
            flex: 1;
            text-align: center;
            font-size: 13px;
            line-height: 1.3;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .values .talla {
            width: 45px;
            text-align: right;
            font-size: 18px;
        }
        .marca-bodega {
            margin-top: 6px;
            font-size: 13px;
            font-weight: bold;
        }
        .local-info {
            margin-top: 6px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .local-info > div:first-child {
            font-size: 12px;
            font-weight: bold;
        }
        .barcode img {
            max-width: 140px;
            height: auto;
        }
        .footer-banner {
            margin-top: 8px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 4px 0;
            letter-spacing: 1px;
        }
        .footer-text {
            margin-top: 4px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            padding-bottom: 4px;
        }
    </style>
</head>
<body>
    ${ticketsHtml}
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
            setTimeout(function() { window.close(); }, 10000);
        };
    </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

/* ── Cuadre (settlement) receipt ── */

interface CuadreItem {
    producto: {
        codigo: string;
        descripcion: string;
    };
    talla: string;
    cantidad: number;
    precio_unitario: number;
}

interface CuadreData {
    facturaId: number;
    localName: string;
    vendedor: string;
    items: CuadreItem[];
    footer?: string;
}

export function printCuadre(data: CuadreData): void {
    const footer = data.footer || import.meta.env.VITE_APP_NAME || '';
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO');
    const hora = now.toLocaleTimeString('es-CO');

    const totalPares = data.items.reduce((acc, d) => acc + d.cantidad, 0);
    const totalDinero = data.items.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0);
    const fmt = (n: number) => '$' + n.toLocaleString('es-CO');

    const itemsHtml = data.items
        .map(
            (d) => `
            <tr>
                <td colspan="4" style="font-size:11px;padding:3px 0 0;font-weight:bold;">${d.producto.descripcion}</td>
            </tr>
            <tr>
                <td style="padding:0 0 4px;">${d.producto.codigo}</td>
                <td></td>
                <td style="text-align:center;">${d.talla}</td>
                <td style="text-align:right;">${fmt(d.precio_unitario)}</td>
            </tr>`,
        )
        .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cuadre Factura #${data.facturaId}</title>
    <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; color: #000; }
        .ticket { padding: 4mm 3mm; width: 80mm; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        h2 { font-size: 15px; text-align: center; margin-bottom: 2px; }
        h3 { font-size: 14px; text-align: center; margin-bottom: 4px; }
        .info { font-size: 11px; text-align: center; margin-bottom: 2px; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .field { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px; }
        .field b { min-width: 80px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; font-size: 11px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 2px; }
        th:nth-child(3), th:nth-child(4) { text-align: center; }
        th:last-child { text-align: right; }
        .totals { margin-top: 6px; }
        .totals .field { font-weight: bold; font-size: 13px; }
        .grand-totals { border-top: 2px solid #000; margin-top: 4px; padding-top: 4px; }
        .grand-totals .field { font-size: 14px; }
        .disclaimer { margin-top: 8px; text-align: center; font-size: 12px; font-weight: bold; line-height: 1.4; }
        .footer-text { margin-top: 6px; text-align: center; font-size: 11px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="ticket">
        <h2>PENDIENTES X CANCELAR</h2>
        <h3>${data.localName}</h3>
        <div class="info">${fecha} ${hora}</div>

        <div class="divider"></div>

        <div class="field"><b>FACTURA</b><span>${data.facturaId}</span></div>
        <div class="field"><b>VENDEDOR</b><span>${data.vendedor}</span></div>

        <div class="divider"></div>

        <table>
            <thead>
                <tr>
                    <th>Ref</th>
                    <th></th>
                    <th>Talla</th>
                    <th>Precio</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="totals">
            <div class="divider"></div>
            <div class="field"><b>SUBTOTAL</b><span>${fmt(totalDinero)}</span></div>
            <div class="field"><b>PARES</b><span>${totalPares}</span></div>
        </div>

        <div class="grand-totals">
            <div class="field"><b>TOTAL</b><span>${fmt(totalDinero)}</span></div>
            <div class="field"><b>PARES</b><span>${totalPares}</span></div>
        </div>

        <div class="disclaimer">Conserve el Sticker o Factura para realizar cambios o garant&iacute;as (15) d&iacute;as.</div>
        ${footer ? `<div class="footer-text">${footer}</div>` : ''}
    </div>
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
            setTimeout(function() { window.close(); }, 10000);
        };
    </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}
