import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const viewerOpenRef = useRef(false);

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

    const calculateNewPrice = (originalPrice: number, currentPrice: number, discountStr: string) => {
        if (discountStr === '') return currentPrice;
        const discount = parseFloat(discountStr) || 0;
        return Math.max(0, originalPrice - discount);
    };

    const handleModalClose = useCallback(() => {
        if (!viewerOpenRef.current) {
            onClose();
        }
    }, [onClose]);

    const openViewer = useCallback((foto: string) => {
        viewerOpenRef.current = true;
        setViewerImage(foto);
    }, []);

    const closeViewer = useCallback(() => {
        viewerOpenRef.current = false;
        setViewerImage(null);
    }, []);

    return (
        <Modal
            show={isOpen}
            closeable={true}
            onClose={handleModalClose}
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
                className="p-6 space-y-6 bg-background"
            >
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-border rounded-2xl shadow-sm custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <TableRow>
                                <TableHead className="w-16 font-bold text-foreground">Foto</TableHead>
                                <TableHead className="font-bold text-foreground">Referencia</TableHead>
                                <TableHead className="w-30 font-bold text-foreground">Cant. Total</TableHead>
                                <TableHead className="w-32 font-bold text-foreground">Precio Sugerido</TableHead>
                                <TableHead className="w-32 font-bold text-foreground">Precio Actual</TableHead>
                                <TableHead className="w-32 font-bold text-foreground">Desc. Actual</TableHead>
                                <TableHead className="w-43 font-bold text-foreground">Nuevo Descuento ($)</TableHead>
                                <TableHead className="w-32 font-bold text-foreground">Precio Final</TableHead>
                                <TableHead className="w-36 pr-6 font-bold text-foreground">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedItems.map((group: any) => {
                                const newDiscount = newDiscounts[group.producto_id] || '';
                                const newPrice = calculateNewPrice(group.originalPrice, group.currentPrice, newDiscount);
                                const total = newPrice * group.totalInvoiceQuantity;

                                return (
                                    <TableRow key={group.producto_id} className="hover:bg-muted/10 transition-colors">
                                        <TableCell>
                                            <div
                                                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 transition-transform hover:scale-110 active:scale-95"
                                                onClick={() => group.producto?.foto && openViewer(group.producto.foto)}
                                            >
                                                {group.producto?.foto ? (
                                                    <img src={group.producto.foto} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[8px] text-slate-400">N/A</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs">
                                                    {group.producto?.codigo}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={group.producto?.descripcion}>
                                                    {group.producto?.descripcion}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground font-medium">{group.totalInvoiceQuantity} ud.</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="">
                                            ${group.originalPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            ${group.currentPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-foreground text-[13px] font-bold">
                                            ${(group.originalPrice - group.currentPrice).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <input
                                                type="number"
                                                value={newDiscount}
                                                onChange={(e) => handleDiscountChange(group.producto_id, e.target.value)}
                                                placeholder="0"
                                                className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center font-bold text-foreground"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-indigo-600">
                                            ${newPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="pr-6 font-medium text-foreground">
                                            ${total.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {groupedItems.length > 0 && (
                                <TableRow className="bg-muted/30 hover:bg-muted/30 font-medium border-t-2 border-border">
                                    <TableCell colSpan={7} className="text-right text-muted-foreground uppercase text-[10px] tracking-wider">
                                        Total tras Descuentos Masivos:
                                    </TableCell>
                                    <TableCell className="text-right pr-6 text-indigo-700 font-bold text-lg font-mono">
                                        ${groupedItems.reduce((acc, group) => {
                                            const newDiscount = newDiscounts[group.producto_id] || '';
                                            const newPrice = calculateNewPrice(group.originalPrice, group.currentPrice, newDiscount);
                                            return acc + (newPrice * group.totalInvoiceQuantity);
                                        }, 0).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="pt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-sm text-muted-foreground border-t border-border mt-2">
                    <p className="flex items-center gap-2 italic text-slate-500">
                        <Tag className="h-4 w-4 text-indigo-500" />
                        Los descuentos se aplican sobre el precio de venta original.
                    </p>
                    <div className="w-full md:w-auto">
                        <FormButtons
                            processing={processing}
                            reset={onClose}
                            buttons={{ cancel: true, submit: true }}
                            labels={{ cancel: 'Cancelar', submit: 'Aplicar Descuentos' }}
                            submitDisabled={Object.values(newDiscounts).every(v => v === '')}
                        />
                    </div>
                </div>
            </form>

            <ViewerModal
                show={!!viewerImage}
                onClose={closeViewer}
                image={viewerImage}
            />
        </Modal>
    );
};
