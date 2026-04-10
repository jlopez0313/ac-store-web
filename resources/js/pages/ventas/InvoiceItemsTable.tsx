import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Package, Tag, Trash, Warehouse } from 'lucide-react';
import React from 'react';

interface InvoiceItemsTableProps {
    factura: any;
    isAdmin: boolean;
    bodegas: any[];
    selectedDetailIds: number[];
    onToggleSelectAll: () => void;
    onToggleSelectDetail: (id: number) => void;
    onUpdatePrice: (detalle: any) => void;
    onDeleteDetail: (id: number) => void;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
    factura,
    isAdmin,
    bodegas,
    selectedDetailIds,
    onToggleSelectAll,
    onToggleSelectDetail,
    onUpdatePrice,
    onDeleteDetail
}) => {
    const getPriceHighlight = (detalle: any) => {
        const sugerido = Number(detalle.precio_sugerido || 0);
        const descuento = Number(detalle.descuento_bodega || 0);
        const unitario = Number(detalle.precio_unitario || 0);
        const baseConDescuento = sugerido - descuento;

        if (unitario === sugerido) return '';
        if (unitario === baseConDescuento) return 'bg-amber-50 text-amber-700 border-amber-200';
        if (unitario < baseConDescuento) return 'bg-red-50 text-red-700 border-red-200';
        return '';
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0">
            <CardContent className="p-0 overflow-x-auto w-full max-w-full flex-1 min-w-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-12 px-4 py-3">
                                {isAdmin && factura.estado === 'abierta' && (
                                    <Checkbox
                                        checked={factura.detalles?.length > 0 && selectedDetailIds.length === factura.detalles?.length}
                                        onCheckedChange={onToggleSelectAll}
                                    />
                                )}
                            </TableHead>
                            <TableHead className="w-32 font-bold text-slate-700">Ref</TableHead>
                            <TableHead className="font-bold text-slate-700">Producto</TableHead>
                            <TableHead className="w-56 font-bold text-slate-700">Ubicación</TableHead>
                            <TableHead className="w-20 text-center font-bold text-slate-700">Cant.</TableHead>
                            <TableHead className="w-48 text-right font-bold text-slate-700">Precio</TableHead>
                            <TableHead className="w-32 text-right pr-6 font-bold text-slate-700">Subtotal</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {factura.detalles?.map((detalle: any) => (
                            <TableRow key={detalle.id} className="group hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                                <TableCell className="px-4 py-4">
                                    {isAdmin && factura.estado === 'abierta' && (
                                        <Checkbox
                                            checked={selectedDetailIds.includes(detalle.id)}
                                            onCheckedChange={() => onToggleSelectDetail(detalle.id)}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono font-black text-indigo-600 text-sm bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                        {detalle.producto?.codigo}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-medium text-slate-900 leading-tight">{detalle.producto?.descripcion}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Tag className="h-2.5 w-2.5" />
                                            {detalle.producto?.marca} · Talla {detalle.talla}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                            {bodegas?.find((b: any) => b.id == detalle.bodega_id)?.nombre || '-'}
                                        </div>
                                        {isAdmin && (
                                            <div className="text-[10px] text-slate-400 font-bold uppercase pl-5">
                                                {detalle.estanteria_nombre || '-'}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="text-sm font-medium text-slate-900">{detalle.cantidad}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span className={`px-2 py-1 rounded-lg border text-sm font-medium transition-all shadow-sm ${getPriceHighlight(detalle) || 'bg-white border-slate-100 text-slate-700'}`}>
                                            ${Number(detalle.precio_unitario || 0).toLocaleString()}
                                        </span>
                                        {factura.estado === 'abierta' && isAdmin && (
                                            <button
                                                onClick={() => onUpdatePrice(detalle)}
                                                className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <span className="text-sm font-bold text-slate-900">${Number(detalle.subtotal || 0).toLocaleString()}</span>
                                </TableCell>
                                <TableCell className="p-0 text-center">
                                    {factura.estado === 'abierta' && isAdmin && (
                                        <button
                                            onClick={() => onDeleteDetail(detalle.id)}
                                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!factura.detalles?.length && (
                            <TableRow>
                                <TableCell colSpan={8} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                            <Package className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin productos</p>
                                            <p className="text-xs text-slate-300">No hay productos registrados en esta factura.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
