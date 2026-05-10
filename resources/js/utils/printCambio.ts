import JsBarcode from 'jsbarcode';

interface CambioItem {
    id: number;
    fecha: string;
    local: { name: string };
    venta_id: number;
    nueva_venta_id: number;
    detalle_original: {
        producto: { codigo: string, descripcion: string, marca: string };
        talla: string;
        bodega_nombre: string;
        estanteria_nombre: string;
    };
    producto_nuevo: { codigo: string, descripcion: string, marca: string };
    nuevo_item_bodega: string;
    nuevo_item_estanteria: string;
    talla_nueva: string;
    precio_original: number;
    precio_nuevo: number;
    diferencia: number;
    observacion: string;
    creado_por_name: string;
}

interface CambioPrintData {
    localName: string;
    items: CambioItem[];
    footer?: string;
}

function generateBarcodeSvg(value: string): string {
    try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svg, value, {
            format: 'CODE128',
            width: 1.5,
            height: 30,
            displayValue: false,
            margin: 0,
        });
        return svg.outerHTML;
    } catch {
        return '';
    }
}

function buildCambioTicketHtml(item: CambioItem, localName: string, footer: string): string {
    const barcodeSvgOrig = generateBarcodeSvg(item.detalle_original.producto.codigo);
    const barcodeSvgNew = generateBarcodeSvg(item.producto_nuevo.codigo);

    return `
        <div class="ticket cambio-ticket">
            <div class="cambio-header">SOPORTE DE CAMBIO</div>
            
            <table class="invoice-info">
                <tr>
                    <td><b>FAC ORIG:</b> #${item.venta_id}</td>
                    <td style="text-align: right;"><b>FAC NUEVA:</b> #${item.nueva_venta_id}</td>
                </tr>
            </table>

            <div class="section-title">PRODUCTO DEVUELTO</div>
            <table class="item-details">
                <tr>
                    <td class="col-ref"><b>REF: ${item.detalle_original.producto.codigo}</b></td>
                    <td class="col-talla">Talla: ${item.detalle_original.talla}</td>
                </tr>
                <tr>
                    <td colspan="2" class="col-desc">${item.detalle_original.producto.descripcion}</td>
                </tr>
                <tr>
                    <td class="col-loc">${item.detalle_original.bodega_nombre}</td>
                    <td class="col-loc" style="text-align: right;">EST: ${item.detalle_original.estanteria_nombre}</td>
                </tr>
            </table>

            <div class="arrow-divider">↓ ↓ ↓ CAMBIO POR ↓ ↓ ↓</div>

            <div class="section-title">PRODUCTO NUEVO</div>
            <table class="item-details">
                <tr>
                    <td class="col-ref"><b>REF: ${item.producto_nuevo.codigo}</b></td>
                    <td class="col-talla">Talla: ${item.talla_nueva}</td>
                </tr>
                <tr>
                    <td colspan="2" class="col-desc">${item.producto_nuevo.descripcion}</td>
                </tr>
                <tr>
                    <td class="col-loc">${item.nuevo_item_bodega}</td>
                    <td class="col-loc" style="text-align: right;">EST: ${item.nuevo_item_estanteria}</td>
                </tr>
            </table>

            <div class="price-summary">
                <div class="price-line">Precio Original: $${Number(item.precio_original).toLocaleString()}</div>
                <div class="price-line">Precio Nuevo: $${Number(item.precio_nuevo).toLocaleString()}</div>
                <div class="price-line highlight">Diferencia Pagada: $${Number(item.diferencia).toLocaleString()}</div>
            </div>

            <div class="reason-box">
                <div class="reason-label">OBSERVACIÓN:</div>
                <div class="reason-text">${item.observacion || 'Sin observación'}</div>
            </div>

            <table class="info-row">
                <tr>
                    <td class="col-local">
                        <div>${localName}</div>
                        <div>${new Date(item.fecha).toLocaleString()}</div>
                        <div class="user-info">Por: ${item.creado_por_name}</div>
                    </td>
                    <td class="col-barcode">
                        ${barcodeSvgNew ? `<div class="barcode-wrap">${barcodeSvgNew}</div>` : ''}
                        <div class="barcode-code">${item.producto_nuevo.codigo}</div>
                    </td>
                </tr>
            </table>
            
            <div class="footer-banner cambio-banner">SOPORTE DE CAMBIO</div>
            <div class="footer-text">${footer}</div>
        </div>
    `;
}

const CAMBIO_TICKET_CSS = `
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
        .cambio-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            border: 2px solid #000;
            padding: 4px 0;
        }
        .invoice-info {
            font-size: 10px;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
        }
        .section-title {
            font-size: 9px;
            font-weight: bold;
            background: #eee;
            padding: 2px 4px;
            margin-bottom: 4px;
            text-align: center;
        }
        .item-details {
            margin-bottom: 6px;
        }
        .col-ref { width: 60%; font-size: 11px; }
        .col-talla { width: 40%; font-size: 11px; text-align: right; }
        .col-desc { font-size: 10px; padding: 2px 0; line-height: 1.1; }
        .col-loc { font-size: 9px; color: #333; }
        
        .arrow-divider {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .price-summary {
            margin: 10px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 4px 0;
        }
        .price-line {
            font-size: 10px;
            display: flex;
            justify-content: space-between;
        }
        .price-line.highlight {
            font-size: 12px;
            font-weight: bold;
            margin-top: 2px;
        }

        .reason-box {
            margin: 8px 0;
            padding: 4px;
            border: 1px dashed #000;
        }
        .reason-label {
            font-size: 8px;
            font-weight: bold;
        }
        .reason-text {
            font-size: 10px;
            font-style: italic;
        }

        .info-row { margin-top: 6px; }
        .info-row .col-local  { width: 50%; font-size: 9px; font-weight: bold; vertical-align: bottom; }
        .info-row .col-barcode { width: 50%; text-align: right; vertical-align: bottom; }
        .user-info { font-size: 8px; margin-top: 1px; }
        
        .barcode-wrap svg { width: 100%; height: auto; display: block; }
        .barcode-code {
            font-size: 8px;
            text-align: center;
            margin-top: 1px;
        }
        .footer-banner {
            margin-top: 8px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #000;
            padding: 2px 0;
        }
        .cambio-banner {
            background-color: #f0f0f0;
        }
        .footer-text {
            margin-top: 4px;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
        }
`;

function wrapHtml(bodyContent: string, title = 'Soporte de Cambio'): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>${CAMBIO_TICKET_CSS}</style>
</head>
<body onload="window.print()">
    ${bodyContent}
</body>
</html>`;
}

export function buildCambioPageHtml(data: CambioPrintData): string[] {
    const footer = data.footer || `${import.meta.env.VITE_APP_NAME || 'BodegaStock'} / ${import.meta.env.VITE_SUPPORT_URL || 'bodegastock.com'} / WA: ${import.meta.env.VITE_SUPPORT_WHATSAPP || '322 5086903'}`;
    return data.items.map((item) =>
        wrapHtml(buildCambioTicketHtml(item, data.localName, footer))
    );
}

export function printCambios(data: CambioPrintData, returnHtml = false): string | void {
    const footer = data.footer || `${import.meta.env.VITE_APP_NAME || 'BodegaStock'} / ${import.meta.env.VITE_SUPPORT_URL || 'bodegastock.com'} / WA: ${import.meta.env.VITE_SUPPORT_WHATSAPP || '322 5086903'}`;
    const ticketsHtml = data.items.map((item) => buildCambioTicketHtml(item, data.localName, footer)).join('');

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
