import JsBarcode from 'jsbarcode';

function generateBarcodeSvg(value: string): string {
    try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svg, value, {
            format: 'CODE128',
            width: 2,
            height: 40,
            displayValue: false,
            margin: 0,
        });
        return svg.outerHTML;
    } catch {
        return '';
    }
}

const STICKER_CSS = `
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Arial', sans-serif;
        width: 100%;
        color: #000;
    }
    .sticker {
        width: 100%;
        padding: 5mm;
        text-align: center;
        border-bottom: 1px dashed #ccc;
        page-break-after: always;
    }
    .marca { font-size: 14px; font-weight: bold; text-transform: uppercase; }
    .talla-wrap { margin: 5px 0; }
    .talla-label { font-size: 10px; color: #666; }
    .talla-value { font-size: 24px; font-weight: 900; }
    .descripcion { font-size: 11px; margin-bottom: 5px; line-height: 1.2; }
    .location { font-size: 9px; font-weight: bold; margin-bottom: 8px; color: #444; }
    .barcode-svg svg { width: 80%; height: auto; }
    .barcode-text { font-size: 10px; font-family: monospace; margin-top: 2px; }
`;

function buildStickerHtml(sticker: any): string {
    const ref = sticker.referencia;
    const barcodeContent = ref.sistema_viejo ? ref.codigo : `${ref.codigo}-${sticker.talla}`;
    const barcodeSvg = generateBarcodeSvg(barcodeContent);

    return `
        <div class="sticker">
            <div class="marca">${ref.marca?.nombre || 'N/A'}</div>
            <div class="talla-wrap">
                <span class="talla-label">TALLA</span><br/>
                <span class="talla-value">${sticker.talla}</span>
            </div>
            <div class="descripcion">${ref.descripcion}</div>
            <div class="location">
                ${sticker.estanteria?.bodega?.nombre || ''} - ${sticker.estanteria?.nombre || ''}
            </div>
            <div style="font-size: 14px; font-weight: 900; margin-bottom: 8px; border: 2px solid #000; padding: 2px; display: inline-block;">
                CANTIDAD TOTAL: ${sticker.cantidad || 1}
            </div>
            <div class="barcode-area">
                ${barcodeSvg ? `<div class="barcode-svg">${barcodeSvg}</div>` : ''}
                <div class="barcode-text">${barcodeContent}</div>
            </div>
        </div>
    `;
}

export function buildStickerPageHtml(stickers: any[]): string[] {
    // Group stickers by reference and size to print a single summary sticker
    const grouped: Record<string, any> = {};

    stickers.forEach(s => {
        const key = `${s.referencia_id}-${s.talla}-${s.estanteria_id}`;
        if (!grouped[key]) {
            grouped[key] = { ...s, cantidad: 0 };
        }
        grouped[key].cantidad += (s.cantidad || 1);
    });

    const pages: string[] = [];
    Object.values(grouped).forEach(sticker => {
        pages.push(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>${STICKER_CSS}</style>
            </head>
            <body onload="window.print()">
                ${buildStickerHtml(sticker)}
            </body>
            </html>
        `);
    });
    return pages;
}
