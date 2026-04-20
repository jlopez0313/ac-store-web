import axios from 'axios';

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

export async function printCuadre(data: CuadreData): Promise<boolean> {
    try {
        const res = await axios.post(route('api.print.cuadre'), {
            facturaId: data.facturaId,
            localName: data.localName,
            vendedor: data.vendedor,
            items: data.items,
            footer: data.footer,
        });
        return res.data.ok;
    } catch {
        return false;
    }
}
