import { Modal } from '@/components/ui/Modal';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface BulkDiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: any[];
    allInvoiceItems: any[];
    onApply: (discounts: Record<number, number>) => void;
    processing: boolean;
}

export const BulkDiscountModal: React.FC<BulkDiscountModalProps> = ({
    isOpen,
    onClose,
    selectedItems,
    allInvoiceItems,
    onApply,
    processing
}) => {
    const [newDiscounts, setNewDiscounts] = useState<Record<number, string>>({});

    // Group items by reference
    const groupedItems = useMemo(() => {
        const groups: Record<number, any> = {};

        selectedItems.forEach(item => {
            const refId = item.producto_id;
            if (!groups[refId]) {
                // Find all items in the invoice with this reference to get total quantity
                const totalQuantity = allInvoiceItems
                    .filter(i => i.producto_id === refId)
                    .reduce((acc, i) => acc + Number(i.cantidad || 0), 0);

                groups[refId] = {
                    producto_id: refId,
                    producto: item.producto,
                    selectedQuantity: 0,
                    totalInvoiceQuantity: totalQuantity,
                    originalPrice: Number(item.precio_sugerido || 0),
                    currentPrice: Number(item.precio_unitario || 0),
                    items: []
                };
            }
            groups[refId].selectedQuantity += Number(item.cantidad || 1);
            groups[refId].items.push(item);
        });

        return Object.values(groups).sort((a: any, b: any) => {
            return (a.producto?.codigo || '').localeCompare(b.producto?.codigo || '');
        });
    }, [selectedItems, allInvoiceItems]);

    // Reset discounts when opening
    useEffect(() => {
        if (isOpen) {
            const initial: Record<number, string> = {};
            groupedItems.forEach(g => {
                // Default to current discount? Or empty?
                // User said "precio de venta - nuevo descuento"
                // Let's leave it empty so they can type
                initial[g.producto_id] = '';
            });
            setNewDiscounts(initial);
        }
    }, [isOpen, groupedItems]);

    const handleDiscountChange = (refId: number, value: string) => {
        setNewDiscounts(prev => ({ ...prev, [refId]: value }));
    };

    const calculateNewPrice = (originalPrice: number, discountStr: string) => {
        const discount = parseFloat(discountStr) || 0;
        return Math.max(0, originalPrice - discount);
    };

    return (
        <Modal
            show={isOpen}
            closeable={true}
            onClose={onClose}
            title="Descuento Masivo por Referencia"
            maxWidth="5xl"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const discounts: Record<number, number> = {};
                    Object.entries(newDiscounts).forEach(([id, val]) => {
                        if (val !== '') discounts[parseInt(id)] = parseFloat(val);
                    });
                    onApply(discounts);
                }}
                className="p-6 space-y-6 bg-white"
            >
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-slate-200 rounded-2xl shadow-sm custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow>
                                <TableHead className="font-bold text-slate-700">Referencia</TableHead>
                                <TableHead className="w-30 text-center font-bold text-slate-700">Cant. Total</TableHead>
                                <TableHead className="w-32 text-right font-bold text-slate-700">Precio Venta</TableHead>
                                <TableHead className="w-32 text-right font-bold text-slate-700">Precio Actual</TableHead>
                                <TableHead className="w-43 text-center font-bold text-slate-700">Nuevo Descuento ($)</TableHead>
                                <TableHead className="w-32 text-right font-bold text-slate-700">Precio Final</TableHead>
                                <TableHead className="w-36 text-right pr-6 font-bold text-slate-700">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedItems.map((group: any) => {
                                const newDiscount = newDiscounts[group.producto_id] || '';
                                const newPrice = calculateNewPrice(group.originalPrice, newDiscount);
                                const total = newPrice * group.totalInvoiceQuantity;

                                return (
                                    <TableRow key={group.producto_id} className="hover:bg-slate-50/30 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono font-black text-indigo-600 text-xs">
                                                    {group.producto?.codigo}
                                                </span>
                                                <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                                    {group.producto?.descripcion}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm text-slate-400 font-medium">{group.totalInvoiceQuantity} ud.</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400 text-sm">
                                            ${group.originalPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400 text-sm">
                                            ${group.currentPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <input
                                                type="number"
                                                value={newDiscount}
                                                onChange={(e) => handleDiscountChange(group.producto_id, e.target.value)}
                                                placeholder="0"
                                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-center font-bold"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-indigo-600">
                                            ${newPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-medium text-slate-900">
                                            ${total.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {groupedItems.length > 0 && (
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 font-medium border-t-2 border-slate-200">
                                    <TableCell colSpan={6} className="text-right text-slate-500 uppercase text-[10px]">
                                        Total tras Descuentos Masivos:
                                    </TableCell>
                                    <TableCell className="text-right pr-6 text-indigo-700">
                                        ${groupedItems.reduce((acc, group) => {
                                            const newDiscount = newDiscounts[group.producto_id] || '';
                                            const newPrice = calculateNewPrice(group.originalPrice, newDiscount);
                                            return acc + (newPrice * group.totalInvoiceQuantity);
                                        }, 0).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="pt-4 flex justify-between items-center text-sm text-slate-500">
                    <p className="flex items-center gap-2 italic">
                        <Tag className="h-4 w-4" />
                        Los descuentos se aplican sobre el precio de venta original.
                    </p>
                    <FormButtons
                        processing={processing}
                        reset={onClose}
                        buttons={{ cancel: true, submit: true }}
                        labels={{ cancel: 'Cancelar', submit: 'Aplicar Descuentos' }}
                        submitDisabled={Object.values(newDiscounts).every(v => v === '')}
                    />
                </div>
            </form>
        </Modal>
    );
};
