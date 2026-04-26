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

export function printCuadre(data: CuadreData, returnHtml = false): string | void {
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
    <meta name="viewport" content="width=302px">
    <title>Cuadre Factura #${data.facturaId}</title>
    <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 302px; max-width: 302px; overflow: hidden; color: #000; }
        .ticket { padding: 4mm 3mm; width: 100%; max-width: 302px; overflow: hidden; }
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
    </div>
</body>
</html>`;

    if (returnHtml) {
        return html;
    }

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}
