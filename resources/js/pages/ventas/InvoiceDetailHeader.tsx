import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { showAlert } from '@/plugins/sweetalert';
import { router } from '@inertiajs/react';
import { Plus, ShoppingCart, Warehouse } from 'lucide-react';
import React, { useState } from 'react';
import { BulkDiscountModal } from './BulkDiscountModal';

interface InvoiceDetailHeaderProps {
    factura: any;
    isAdmin: boolean;
    selectedDetailIds: number[];
    onBulkDelete: () => void;
    onAddProduct: () => void;
    onCloseFactura: () => void;
}

export const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({
    factura,
    isAdmin,
    selectedDetailIds,
    onBulkDelete,
    onAddProduct,
    onCloseFactura
}) => {
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [applying, setApplying] = useState(false);

    const sameRefItemsCount = React.useMemo(() => {
        if (!selectedDetailIds.length || !factura.detalles) return 0;
        const selectedRefs = new Set(
            factura.detalles
                .filter((d: any) => selectedDetailIds.includes(d.id))
                .map((d: any) => d.producto_id)
        );
        return factura.detalles.filter((d: any) => selectedRefs.has(d.producto_id)).length;
    }, [selectedDetailIds, factura.detalles]);

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Factura de Venta N°</Label>
                        <div className="text-2xl font-bold text-primary">#{factura.id}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium pt-1">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                <Warehouse className="h-4 w-4 text-slate-400" />
                            </div>
                            {factura.local?.name}
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <Badge
                            variant="outline"
                            className={`px-3 py-1 text-xs ${factura.estado === 'cerrada' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                        >
                            {factura.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
                        </Badge>
                        <div className="text-xs font-medium text-slate-400 uppercase">
                            {new Date(factura.fecha).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-wrap gap-2">
                        {factura.estado === 'abierta' && (
                            <>
                                {isAdmin && selectedDetailIds.length > 0 && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsBulkModalOpen(true)}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex flex-col justify-center gap-0.5 transition-colors group"
                                        >
                                            <span className="text-[9px] text-slate-400 uppercase tracking-tight">
                                                {sameRefItemsCount} con misma referencia
                                            </span>
                                            <span className="group-hover:text-indigo-600 transition-colors">Descontar x mayor</span>
                                        </button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={onBulkDelete}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95"
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    onClick={onAddProduct}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Producto
                                </Button>
                                {factura.detalles?.length > 0 && isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCloseFactura}
                                        className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-10 px-4 rounded-xl transition-all active:scale-95"
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Cerrar Factura
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Total Factura</span>
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
                    router.post(route('api.ventas.bulk_discounts', factura.id), {
                        discounts
                    }, {
                        onStart: () => setApplying(true),
                        onFinish: () => setApplying(false),
                        onSuccess: () => {
                            showAlert('success', 'Descuentos aplicados correctamente');
                            setIsBulkModalOpen(false);
                        },
                        onError: () => {
                            showAlert('error', 'Ocurrió un error al aplicar los descuentos');
                        }
                    });
                }}
            />
        </Card>
    );
};
