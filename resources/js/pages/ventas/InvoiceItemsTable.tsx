import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Edit, ExternalLink, Package, RefreshCcw, Tag, Trash, Warehouse } from 'lucide-react';
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
    onViewInvoice?: (id: number) => void;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
    factura,
    isAdmin,
    bodegas,
    selectedDetailIds,
    onToggleSelectAll,
    onToggleSelectDetail,
    onUpdatePrice,
    onDeleteDetail,
    onViewInvoice,
}) => {
    const getPriceHighlight = (detalle: any) => {
        const sugerido = Number(detalle.precio_sugerido || 0);
        const descuento = Number(detalle.descuento_bodega || 0);
        const unitario = Number(detalle.precio_unitario || 0);
        const baseConDescuento = sugerido - descuento;

        if (unitario === sugerido) return '';
        if (unitario === baseConDescuento)
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800';
        if (unitario < baseConDescuento) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800';
        return '';
    };

    return (
        <Card className="flex min-w-0 flex-col overflow-hidden border-slate-200 shadow-sm dark:border-slate-700">
            <CardContent className="custom-scrollbar max-h-[calc(100vh-25rem)] w-full max-w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto p-0">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/50 backdrop-blur-sm dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="w-12 px-4 py-3">
                                {isAdmin && factura.estado === 'abierta' && (
                                    <Checkbox
                                        checked={factura.detalles?.length > 0 && selectedDetailIds.length === factura.detalles?.length}
                                        onCheckedChange={onToggleSelectAll}
                                    />
                                )}
                            </TableHead>
                            <TableHead className="w-32 font-bold text-slate-700 dark:text-slate-300">Ref</TableHead>
                            <TableHead className="font-bold text-slate-700 dark:text-slate-300">Producto</TableHead>
                            <TableHead className="w-56 font-bold text-slate-700 dark:text-slate-300">Ubicación</TableHead>
                            <TableHead className="w-20 font-bold text-slate-700 dark:text-slate-300">Cant.</TableHead>
                            <TableHead className="w-48 font-bold text-slate-700 dark:text-slate-300">Precio</TableHead>
                            <TableHead className="w-32 font-bold text-slate-700 dark:text-slate-300">Subtotal</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {factura.detalles?.map((detalle: any) => (
                            <TableRow
                                key={detalle.id}
                                className={cn(
                                    'group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/30 dark:border-slate-800 dark:hover:bg-slate-800/30',
                                    !detalle.impreso && 'bg-yellow-50/60 dark:bg-yellow-950/20',
                                )}
                            >
                                <TableCell className="px-4 py-4">
                                    {isAdmin && factura.estado === 'abierta' && (
                                        <Checkbox
                                            checked={selectedDetailIds.includes(detalle.id)}
                                            onCheckedChange={() => onToggleSelectDetail(detalle.id)}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 font-mono text-sm font-black text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400">
                                        {detalle.producto?.codigo}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm leading-tight font-medium text-slate-900 dark:text-slate-100">
                                            {detalle.producto?.descripcion}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            <Tag className="h-2.5 w-2.5" />
                                            {typeof detalle.producto?.marca === 'object'
                                                ? detalle.producto.marca.nombre
                                                : detalle.producto?.marca || 'N/A'}{' '}
                                            · Talla {detalle.talla}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                            {bodegas?.find((b: any) => b.id == detalle.bodega_id)?.nombre || '-'}
                                        </div>
                                        {isAdmin && (
                                            <div className="pl-5 text-[10px] font-bold text-slate-400 uppercase">
                                                {detalle.estanteria_nombre || '-'}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{detalle.cantidad}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={`rounded-lg border px-2 py-1 text-sm font-medium shadow-sm transition-all ${getPriceHighlight(detalle) || 'border-slate-100 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                                        >
                                            ${Number(detalle.precio_unitario || 0).toLocaleString()}
                                        </span>
                                        {factura.estado === 'abierta' && isAdmin && (
                                            <button
                                                onClick={() => onUpdatePrice(detalle)}
                                                className="rounded-lg p-1.5 text-slate-300 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="pr-6">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        ${Number(detalle.subtotal || 0).toLocaleString()}
                                    </span>
                                </TableCell>
                                <TableCell className="p-0">
                                    <div className="flex items-center justify-end gap-2 px-4">
                                        {detalle.cambio && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="rounded-lg p-2 text-amber-500 transition-all hover:bg-amber-50 data-[state=open]:bg-amber-100 data-[state=open]:text-amber-600 data-[state=open]:shadow-inner"
                                                        title="Ver detalles del cambio"
                                                    >
                                                        <RefreshCcw className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    side="top"
                                                    sideOffset={12}
                                                    className="w-72 rounded-2xl border-slate-800 bg-slate-900 p-4 text-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
                                                >
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                                                                Detalles del Cambio
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                                {detalle.cambio.usuario}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-3">
                                                        <p className="text-[12px] leading-relaxed font-medium text-slate-200 italic">
                                                            "{detalle.cambio.observacion || 'Sin observaciones'}"
                                                        </p>
                                                    </div>

                                                    {detalle.cambio.nueva_venta_id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                onViewInvoice?.(detalle.cambio.nueva_venta_id);
                                                            }}
                                                            className="group/btn flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-400/30 bg-indigo-600 px-3 py-2.5 text-white shadow-xl shadow-indigo-900/40 transition-all hover:bg-indigo-500"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ExternalLink className="h-3.5 w-3.5 text-indigo-200 transition-transform group-hover/btn:scale-110" />
                                                                <span className="text-[11px] font-black tracking-tight uppercase">
                                                                    Ver Factura Nueva
                                                                </span>
                                                            </div>
                                                            <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-100">
                                                                # {detalle.cambio.nueva_venta_id}
                                                            </span>
                                                        </button>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}

                                        {factura.estado === 'abierta' && isAdmin && (
                                            <button
                                                onClick={() => onDeleteDetail(detalle.id)}
                                                className="rounded-lg p-2 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:text-slate-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!factura.detalles?.length && (
                            <TableRow>
                                <TableCell colSpan={8} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                            <Package className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Sin productos
                                            </p>
                                            <p className="text-xs text-slate-300 dark:text-slate-600">
                                                No hay productos registrados en esta factura.
                                            </p>
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
