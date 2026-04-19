import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { showAlert } from '@/plugins/sweetalert';
import { router, usePage } from '@inertiajs/react';
import { ChevronDown, FileText, Plus, Printer, ShoppingCart, Warehouse } from 'lucide-react';
import React, { useState } from 'react';
import { BulkDiscountModal } from './BulkDiscountModal';

interface InvoiceDetailHeaderProps {
    factura: any;
    isAdmin: boolean;
    selectedDetailIds: number[];
    isLocal?: boolean;
    onBulkDelete: () => void;
    onAddProduct: () => void;
    onCloseFactura: () => void;
    onPrint: (type: 'pendientes' | 'cuadre' | 'factura') => void;
}

export const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({
    factura,
    isAdmin,
    isLocal = false,
    selectedDetailIds,
    onBulkDelete,
    onAddProduct,
    onCloseFactura,
    onPrint,
}) => {
    const { time_restriction } = usePage().props as any;
    const { can_operate, is_holiday, schedule_today } = time_restriction || { can_operate: true, is_holiday: false, schedule_today: [] };

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [applying, setApplying] = useState(false);

    const sameRefItemsCount = React.useMemo(() => {
        if (!selectedDetailIds.length || !factura.detalles) return 0;
        const selectedRefs = new Set(factura.detalles.filter((d: any) => selectedDetailIds.includes(d.id)).map((d: any) => d.producto_id));
        return factura.detalles.filter((d: any) => selectedRefs.has(d.producto_id)).length;
    }, [selectedDetailIds, factura.detalles]);

    const isOutsideHours = React.useMemo(() => {
        if (!isLocal || is_holiday) return is_holiday;
        return !can_operate;
    }, [isLocal, is_holiday, can_operate]);

    return (
        <Card className="overflow-hidden border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl">
            <CardContent className="space-y-6 p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase">Factura de Venta N°</Label>
                        <div className="text-primary text-2xl font-bold">#{factura.id}</div>
                        <div className="flex items-center gap-2 pt-1 text-sm font-medium text-slate-500">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                                <Warehouse className="h-4 w-4 text-slate-400" />
                            </div>
                            {factura.local?.name}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                        <Badge
                            variant="outline"
                            className={`px-3 py-1 text-xs ${
                                factura.estado === 'cerrada'
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                        >
                            {factura.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
                        </Badge>
                        <div className="text-xs font-medium text-slate-400 uppercase">{new Date(factura.fecha).toLocaleDateString()}</div>
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-6 border-t border-slate-100 pt-6 md:flex-row md:items-center">
                    <div className="flex flex-wrap gap-2">
                        {factura.estado === 'abierta' && (
                            <>
                                {isAdmin && selectedDetailIds.length > 0 && (
                                    <div className="mr-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsBulkModalOpen(true)}
                                            className="group flex flex-col justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                        >
                                            <span className="text-[9px] tracking-tight text-slate-400 uppercase">
                                                {sameRefItemsCount} con misma referencia
                                            </span>
                                            <span className="transition-colors group-hover:text-indigo-600">Descontar x mayor</span>
                                        </button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={onBulkDelete}
                                            className="h-10 rounded-xl bg-red-600 px-4 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 active:scale-95"
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                )}
                                {!isOutsideHours && (
                                    <Button
                                        size="sm"
                                        onClick={onAddProduct}
                                        className="h-10 bg-indigo-600 px-4 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Producto
                                    </Button>
                                )}
                                {factura.detalles?.length > 0 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-10 border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                                            >
                                                <Printer className="mr-2 h-4 w-4" />
                                                Imprimir
                                                <ChevronDown className="ml-2 h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => onPrint('pendientes')}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Imprimir pendientes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onPrint('cuadre')}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Imprimir cuadre
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                {factura.detalles?.length > 0 && isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCloseFactura}
                                        className="h-10 border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Cerrar Factura
                                    </Button>
                                )}
                            </>
                        )}
                        {factura.estado === 'cerrada' && factura.detalles?.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPrint('factura')}
                                className="h-10 border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir Factura
                            </Button>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Total Factura</span>
                        <span className="text-2xl font-bold text-slate-900">
                            ${Number(factura.detalles?.reduce((acc: number, d: any) => acc + Number(d.subtotal), 0) || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </CardContent>

            <BulkDiscountModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                selectedItems={factura.detalles?.filter((d: any) => selectedDetailIds.includes(d.id)) || []}
                allInvoiceItems={factura.detalles || []}
                processing={applying}
                onApply={(discounts) => {
                    router.post(
                        route('api.ventas.bulk_discounts', factura.id),
                        {
                            discounts,
                        },
                        {
                            onStart: () => setApplying(true),
                            onFinish: () => setApplying(false),
                            onSuccess: () => {
                                showAlert('success', 'Descuentos aplicados correctamente');
                                setIsBulkModalOpen(false);
                            },
                            onError: () => {
                                showAlert('error', 'Ocurrió un error al aplicar los descuentos');
                            },
                        },
                    );
                }}
            />
        </Card>
    );
};
