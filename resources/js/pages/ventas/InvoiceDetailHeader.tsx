import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showAlert } from '@/plugins/sweetalert';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ChevronDown, FileText, PackageX, Plus, Printer, Save, ShoppingCart, Warehouse } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BulkDiscountModal } from './BulkDiscountModal';
import { DevolucionesFacturaModal } from './DevolucionesFacturaModal';
import { ReopenInvoiceModal } from './ReopenInvoiceModal';

interface InvoiceDetailHeaderProps {
    factura: any;
    isAdmin: boolean;
    selectedDetailIds: number[];
    filteredTotalQty?: number;
    isFiltering?: boolean;
    isLocal?: boolean;
    onBulkDelete: () => void;
    onAddProduct: () => void;
    onCloseFactura: () => void;
    onPrint: (type: 'pendientes' | 'cuadre' | 'factura') => void;
    onUpdateFactura?: (factura: any) => void;
}

export const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({
    factura,
    isAdmin,
    isLocal = false,
    selectedDetailIds,
    filteredTotalQty,
    isFiltering = false,
    onBulkDelete,
    onAddProduct,
    onCloseFactura,
    onPrint,
    onUpdateFactura,
}) => {
    const { time_restriction } = usePage().props as any;
    const { can_operate, is_holiday, schedule_today } = time_restriction || { can_operate: true, is_holiday: false, schedule_today: [] };

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
    const [isDevolucionesModalOpen, setIsDevolucionesModalOpen] = useState(false);
    const [applying, setApplying] = useState(false);
    const [obs, setObs] = useState(factura.observaciones_local || '');
    const [isSavingObs, setIsSavingObs] = useState(false);

    useEffect(() => {
        setObs(factura.observaciones_local || '');
    }, [factura.observaciones_local]);

    const handleSaveObsLocal = async (newObs: string) => {
        setIsSavingObs(true);
        try {
            const response = await axios.post(route('api.ventas.update_observaciones', { venta: factura.id }), {
                observaciones_local: newObs
            });
            showAlert('success', 'Observaciones del local actualizadas');
            if (onUpdateFactura) {
                onUpdateFactura(response.data.data);
            }
        } catch (error) {
            console.error('Error saving local observations:', error);
            showAlert('error', 'No se pudieron guardar las observaciones del local');
        } finally {
            setIsSavingObs(false);
        }
    };

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
        <Card className="overflow-hidden border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="space-y-6 p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase">Factura de Venta N°</Label>
                        <div className="text-primary text-2xl font-bold">#{factura.numero ?? factura.id}</div>
                        <div className="flex items-center gap-2 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <Warehouse className="h-4 w-4 text-slate-400" />
                            </div>
                            {factura.local?.name}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`px-3 py-1.5 text-sm font-bold shadow-sm transition-all ${isFiltering 
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 animate-in fade-in zoom-in duration-300' 
                                    : 'border-indigo-200 bg-indigo-50/50 text-indigo-700'
                                }`}
                                title={isFiltering ? 'Mostrando total filtrado' : 'Total de unidades en la factura'}
                            >
                                <ShoppingCart className={`mr-2 h-4 w-4 ${isFiltering ? 'text-amber-500' : 'text-indigo-500'}`} />
                                {filteredTotalQty ?? 0} Uds. {isFiltering && <span className="ml-1 text-[10px] opacity-70">(Filtrado)</span>}
                                {isFiltering && (
                                    <span className="ml-1.5 flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                    </span>
                                )}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`px-3 py-1 text-xs ${factura.estado === 'cerrada'
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    }`}
                            >
                                {factura.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
                            </Badge>
                        </div>
                        <div className="text-xs font-medium text-slate-400 uppercase dark:text-slate-500">
                            {new Date(factura.fecha).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-6 border-t border-slate-100 pt-6 lg:flex-row lg:items-center dark:border-slate-700">
                    <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center lg:w-auto">
                        {factura.estado === 'abierta' && (
                            <>
                                {isAdmin && selectedDetailIds.length > 0 && (
                                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                                        <button
                                            type="button"
                                            onClick={() => setIsBulkModalOpen(true)}
                                            className="group flex w-full flex-col justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 md:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                            className="h-10 w-full rounded-xl bg-red-600 px-4 font-bold text-white transition-all hover:bg-red-700 md:w-auto active:scale-95"
                                        >
                                            Eliminar {selectedDetailIds.length} {selectedDetailIds.length === 1 ? 'seleccionado' : 'seleccionados'}
                                        </Button>
                                    </div>
                                )}
                                {!isOutsideHours && (
                                    <Button
                                        size="sm"
                                        onClick={onAddProduct}
                                        className="h-10 w-full bg-indigo-600 px-4 text-white transition-all hover:bg-indigo-700 md:w-auto active:scale-95"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Producto
                                    </Button>
                                )}
                                {factura.detalles?.length > 0 && isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCloseFactura}
                                        className="h-10 w-full border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 md:w-auto active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Cerrar Factura
                                    </Button>
                                )}
                                {factura.detalles?.length > 0 && isLocal && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPrint('pendientes')}
                                        className="h-10 w-full border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 md:w-auto active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Imprimir pendientes
                                    </Button>
                                )}
                                {factura.detalles?.length > 0 && !isLocal && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-10 w-full border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 md:w-auto active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                            </>
                        )}
                        {factura.estado === 'cerrada' && factura.detalles?.length > 0 && (
                            <>
                                {isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsReopenModalOpen(true)}
                                        className="h-10 w-full border-amber-200 bg-amber-50 px-4 font-bold text-amber-700 transition-all hover:bg-amber-100 md:w-auto active:scale-95 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                                    >
                                        Reabrir Factura
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPrint('factura')}
                                    className="h-10 w-full border-slate-200 px-4 font-bold text-slate-700 transition-all hover:bg-slate-50 md:w-auto active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimir Factura
                                </Button>
                            </>
                        )}
                        {(factura.detalles?.length > 0 || factura.has_devoluciones) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDevolucionesModalOpen(true)}
                                className="h-10 w-full border-red-200 bg-red-50 px-4 font-bold text-red-700 transition-all hover:bg-red-100 md:w-auto active:scale-95 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                            >
                                <PackageX className="mr-2 h-4 w-4" />
                                Devoluciones
                            </Button>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">Total Factura</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            ${Number(factura.detalles?.reduce((acc: number, d: any) => acc + Number(d.subtotal), 0) || 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-2 dark:border-slate-700">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">Observaciones</Label>
                        <div className="relative group">
                            <Textarea
                                value={obs}
                                onChange={(e) => setObs(e.target.value)}
                                placeholder="Escriba aquí sus observaciones o notas sobre esta factura..."
                                className="min-h-[60px] resize-none border-slate-200 bg-white/50 pr-12 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50"
                            />
                            {(obs !== (factura.observaciones_local || '')) && (
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveObsLocal(obs)}
                                    disabled={isSavingObs}
                                    className="absolute bottom-2 right-2 h-8 w-8 rounded-lg p-0 shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    <Save className={`h-4 w-4 ${isSavingObs ? 'animate-pulse' : ''}`} />
                                </Button>
                            )}
                        </div>
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
                    setApplying(true);
                    axios
                        .post(route('api.ventas.bulk_discounts', { venta: factura.id }), {
                            discounts,
                        })
                        .then((response) => {
                            showAlert('success', 'Descuentos aplicados correctamente');
                            setIsBulkModalOpen(false);
                            if (onUpdateFactura) {
                                onUpdateFactura(response.data.data);
                            }
                            router.reload({ only: ['factura'] });
                        })
                        .catch(() => {
                            showAlert('error', 'Ocurrió un error al aplicar los descuentos');
                        })
                        .finally(() => {
                            setApplying(false);
                        });
                }}
            />

            <ReopenInvoiceModal
                isOpen={isReopenModalOpen}
                onClose={() => setIsReopenModalOpen(false)}
                facturaId={factura.id}
                onSuccess={() => {
                    setIsReopenModalOpen(false);
                    router.reload({ only: ['factura'] });
                }}
            />

            <DevolucionesFacturaModal
                isOpen={isDevolucionesModalOpen}
                onClose={() => setIsDevolucionesModalOpen(false)}
                facturaId={factura.id}
                facturaCodigo={factura.numero}
            />
        </Card>
    );
};
