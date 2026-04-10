import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, ShoppingCart, Warehouse } from 'lucide-react';
import React from 'react';

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
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
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
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={onBulkDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4 rounded-xl shadow-lg shadow-red-100"
                                    >
                                        Eliminar ({selectedDetailIds.length})
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={onAddProduct}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 rounded-xl shadow-lg shadow-indigo-100"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Producto
                                </Button>
                                {factura.detalles?.length > 0 && isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCloseFactura}
                                        className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-10 px-4 rounded-xl"
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
        </Card>
    );
};
