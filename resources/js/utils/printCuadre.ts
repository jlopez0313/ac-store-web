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
    facturaId: number | string;
    localName: string;
    vendedor: string;
    items: CuadreItem[];
    footer?: string;
    diasCambio?: number;
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
                <td colspan="3" style="font-size:10px;padding:3px 0 0;font-weight:bold;word-break:break-word;">${d.producto.descripcion}</td>
            </tr>
            <tr>
                <td style="padding:0 0 4px;font-size:10px;">${d.producto.codigo}</td>
                <td style="text-align:center;font-size:10px;">${d.talla}</td>
                <td style="text-align:right;font-size:10px;">${fmt(d.precio_unitario)}</td>
            </tr>`,
        )
        .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cuadre Factura #${data.facturaId}</title>
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            width: 100%;
            color: #000;
        }
        .ticket { padding: 3mm 2mm; width: 100%; overflow: hidden; }
        h2 { font-size: 13px; text-align: center; margin-bottom: 2px; }
        h3 { font-size: 12px; text-align: center; margin-bottom: 3px; }
        .info { font-size: 10px; text-align: center; margin-bottom: 2px; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }
        .field-table td { font-size: 11px; padding: 1px 0; overflow: hidden; word-break: break-word; }
        .field-table .label { width: 45%; font-weight: bold; }
        .field-table .value { width: 55%; text-align: right; }
        .items-table th {
            font-size: 10px;
            font-weight: bold;
            border-bottom: 1px dashed #000;
            padding-bottom: 2px;
            text-align: left;
        }
        .items-table th:nth-child(2) { text-align: center; }
        .items-table th:nth-child(3) { text-align: right; }
        .items-table td { overflow: hidden; word-break: break-word; }
        .totals-table td { font-size: 11px; font-weight: bold; padding: 1px 0; }
        .totals-table .label { width: 55%; }
        .totals-table .value { width: 45%; text-align: right; }
        .grand td { font-size: 13px; border-top: 2px solid #000; padding-top: 3px; }
        .disclaimer { margin-top: 6px; text-align: center; font-size: 10px; font-weight: bold; line-height: 1.4; }
        .footer-text { margin-top: 5px; text-align: center; font-size: 10px; font-weight: bold; }
    </style>
</head>
<body onload="window.print()">
    <div class="ticket">
        <h2>PENDIENTES X CANCELAR</h2>
        <h3>${data.localName}</h3>
        <div class="info">${fecha} ${hora}</div>

        <div class="divider"></div>

        <table class="field-table">
            <tr><td class="label">FACTURA</td><td class="value">${data.facturaId}</td></tr>
            <tr><td class="label">VENDEDOR</td><td class="value">${data.vendedor}</td></tr>
        </table>

        <div class="divider"></div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:35%;">Ref</th>
                    <th style="width:20%;">Talla</th>
                    <th style="width:45%;">Precio</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals-table">
            <tr><td class="label">SUBTOTAL</td><td class="value">${fmt(totalDinero)}</td></tr>
            <tr><td class="label">PARES</td><td class="value">${totalPares}</td></tr>
        </table>
        <table class="totals-table grand">
            <tr><td class="label">TOTAL</td><td class="value">${fmt(totalDinero)}</td></tr>
            <tr><td class="label">PARES</td><td class="value">${totalPares}</td></tr>
        </table>

        <div class="disclaimer">Conserve el Sticker o Factura para realizar cambios o garant&iacute;as (${data.diasCambio ?? 15}) d&iacute;as.</div>
        ${footer ? `<div class="footer-text">${footer}</div>` : ''}
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
