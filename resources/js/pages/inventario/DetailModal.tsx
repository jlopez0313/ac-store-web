import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Info, Package, Printer, Tag, Warehouse } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { AdjustmentModal } from './AdjustmentModal';

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    referencia: any;
    onAdjust?: (shelf: any, details: any[]) => void;
    onPrint?: (shelf: any) => void;
    bodegas?: any[];
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, referencia, onAdjust, onPrint, bodegas = [] }) => {
    const { auth } = usePage().props as any;
    const canAdjust = ['superadmin', 'admin'].includes(auth.user.role);
    const isLocal = auth.user.role === 'local';
    const [details, setDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [selectedShelf, setSelectedShelf] = useState<any>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [openBodegas, setOpenBodegas] = useState<Record<string, boolean>>({});
    const viewerOpenRef = useRef(false);

    const openViewer = (foto: string) => { viewerOpenRef.current = true; setViewerImage(foto); };
    const closeViewer = () => { viewerOpenRef.current = false; setViewerImage(null); };
    const handleModalClose = () => { if (!viewerOpenRef.current) onClose(); };
    const toggleBodega = (bodega: string) => {
        setOpenBodegas(prev => ({ ...prev, [bodega]: !prev[bodega] }));
    };

    useEffect(() => {
        if (isOpen && referencia) {
            fetchDetails();
        }
    }, [isOpen, referencia]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.inventario.detail', { referencia: referencia.id }));
            setDetails(response.data.data);
        } catch (error) {
            console.error('Error fetching inventory details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = (item: any) => {
        const shelf = {
            id: item.estanteria_id,
            nombre: item.estanteria_nombre,
            bodega_nombre: item.bodega_nombre,
        };
        const itemsForAdjustment = details.filter((d) => d.estanteria_id === item.estanteria_id);

        if (onAdjust) {
            onAdjust(shelf, itemsForAdjustment);
        } else {
            setSelectedShelf(shelf);
            setAdjustmentOpen(true);
        }
    };

    const handleDownloadLabel = async (item: any) => {
        try {
            // Usamos ruta absoluta manual para evitar problemas de caché con Ziggy
            const response = await axios.get(`/descargar-etiqueta/${item.id}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from header if possible, or use default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `etiqueta_${item.id}.csv`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1];
                }
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando etiqueta:', error);
            // Si falla axios, intentamos el método directo como último recurso
            window.open(`/descargar-etiqueta/${item.id}`, '_blank');
        }
    };

    if (!referencia) return null;

    const warehouseTotals = details.reduce((acc: any, item: any) => {
        const key = item.bodega_nombre;
        if (!acc[key]) acc[key] = 0;
        acc[key] += Number(item.stock);
        return acc;
    }, {});

    const totalMuestras = details.reduce((acc: any, item: any) => {
        if (item.subdivision_stock) {
            return acc + Object.values(item.subdivision_stock).reduce((sum: number, qty: any) => sum + Number(qty), 0);
        }
        return acc;
    }, 0);

    return (
        <>
            <Modal show={isOpen} onClose={handleModalClose} title={`Detalle de Inventario: ${referencia.codigo}`} maxWidth="5xl" closeable={true}>
                <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background max-h-[85vh] overflow-y-auto">
                    <div className="space-y-8 p-6">
                        <div className="bg-muted/30 border-border flex flex-col gap-8 rounded-2xl border p-6 shadow-sm md:flex-row md:items-start">
                            {referencia.foto && (
                                <div
                                    onClick={() => openViewer(referencia.foto)}
                                    className="border-border bg-background h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm transition-transform duration-300 hover:scale-105 cursor-pointer"
                                >
                                    <img
                                        src={referencia.foto}
                                        alt={referencia.codigo}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="grid w-full flex-1 grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="flex items-center gap-4">
                                    <div className="bg-background text-muted-foreground border-border/50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground mb-1 text-[10px] leading-none font-medium uppercase">Producto</span>
                                        <span className="text-foreground line-clamp-2 text-sm font-medium md:line-clamp-1">
                                            {referencia.descripcion}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="bg-background text-muted-foreground border-border/50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                                        <Tag className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground mb-1 text-[10px] leading-none font-medium uppercase">Marca</span>
                                        <span className="text-foreground text-sm font-medium">
                                            {typeof referencia.marca === 'object' ? referencia.marca.nombre : referencia.marca || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="bg-background text-muted-foreground border-border/50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground mb-0.5 text-[9px] font-bold uppercase tracking-wider">Venta Disponible</span>
                                            <span className={`text-sm font-bold ${Number(referencia.total_stock) - totalMuestras <= 0 ? 'text-red-500' : 'text-foreground'}`}>
                                                {Number(referencia.total_stock) - totalMuestras} uds
                                            </span>
                                        </div>
                                        {totalMuestras > 0 && (
                                            <div className="flex flex-col border-l border-border pl-6">
                                                <span className="text-amber-600 mb-0.5 text-[9px] font-bold uppercase tracking-wider">Muestras</span>
                                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[11px] py-0 h-5 px-2 font-bold w-fit">
                                                    {totalMuestras} unidades
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-medium uppercase">Distribución por Bodega y Talla</h3>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                                </div>
                            ) : details.length === 0 ? (
                                <div className="bg-muted/30 border-border text-muted-foreground rounded-2xl border border-dashed py-12 text-center">
                                    No se encontraron registros detallados de inventario.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(
                                        details.reduce((acc: any, item: any) => {
                                            const key = item.bodega_nombre;
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(item);
                                            return acc;
                                        }, {})
                                    ).filter(([_, items]: [any, any[]]) => {
                                        return items.reduce((sum, i) => sum + Number(i.stock), 0) > 0;
                                    }).map(([bodega, bodegaItems]: [string, any[]]) => {
                                        const isOpen = !!openBodegas[bodega]; // Default collapsed
                                        return (
                                            <div key={bodega} className="bg-background border-border overflow-hidden rounded-2xl border shadow-sm">
                                                <div
                                                    className="bg-muted/30 flex cursor-pointer items-center justify-between border-b px-6 py-3 transition-colors hover:bg-muted/50"
                                                    onClick={() => toggleBodega(bodega)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Warehouse className={`h-5 w-5 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                                                        <span className="text-sm font-bold uppercase tracking-wide">{bodega}</span>
                                                        {bodegaItems[0]?.descuento > 0 && (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none px-1.5 py-0 h-4">
                                                                - ${Number(bodegaItems[0].descuento).toLocaleString()}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="font-bold">
                                                            {bodegaItems.reduce((sum, i) => sum + Number(i.stock), 0)} unidades
                                                        </Badge>
                                                        <div className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.13523 6.15803C3.3241 5.95657 3.64057 5.94637 3.84203 6.13523L7.5 9.56464L11.158 6.13523C11.3594 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67597 11.842 6.86484L7.84199 10.6148C7.64491 10.7996 7.35509 10.7996 7.15801 10.6148L3.15801 6.86484C2.95655 6.67597 2.94635 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isOpen && (
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/50">
                                                            <TableRow>
                                                                <TableHead className="text-foreground h-10 font-bold">Estantería</TableHead>
                                                                <TableHead className="text-foreground h-10 text-center font-bold">Talla</TableHead>
                                                                <TableHead className="text-foreground h-10 text-center font-bold">Stock</TableHead>
                                                                <TableHead className="text-foreground h-10 text-center font-bold">Muestras</TableHead>
                                                                {!isLocal && <TableHead className="text-foreground h-10 text-right font-bold">Costo</TableHead>}
                                                                <TableHead className="text-foreground h-10 text-right font-bold">Venta</TableHead>
                                                                {canAdjust && <TableHead className="text-foreground h-10 pr-6 text-right font-bold">Acciones</TableHead>}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {bodegaItems.map((item: any) => (
                                                                <TableRow key={item.id} className="hover:bg-muted/20 border-border/50 transition-colors">
                                                                    <TableCell className="text-xs font-medium uppercase text-muted-foreground">
                                                                        {item.estanteria_nombre}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Badge variant="outline" className="bg-background border-border font-mono text-xs">
                                                                            {item.talla}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <span className={`text-sm font-bold ${item.stock <= 0 ? 'text-red-500' : 'text-foreground'}`}>
                                                                            {item.stock}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {item.subdivision_stock && Object.entries(item.subdivision_stock).some(([_, qty]) => Number(qty) > 0) ? (
                                                                            <div className="flex flex-wrap justify-center gap-2">
                                                                                {Object.entries(item.subdivision_stock)
                                                                                    .filter(([_, qty]) => Number(qty) > 0)
                                                                                    .map(([side, qty]) => (
                                                                                        <Badge key={side} variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
                                                                                            {side}: {qty}
                                                                                        </Badge>
                                                                                    ))
                                                                                }
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-tight">Venta</span>
                                                                        )}
                                                                    </TableCell>
                                                                    {!isLocal && (
                                                                        <TableCell className="text-muted-foreground text-right text-xs font-medium">
                                                                            ${Number(item.precio_compra).toLocaleString()}
                                                                        </TableCell>
                                                                    )}
                                                                    <TableCell className="text-foreground text-right text-xs font-medium">
                                                                        ${Number(item.precio_ajustado).toLocaleString()}
                                                                    </TableCell>
                                                                    {canAdjust && (
                                                                        <TableCell className="pr-6 text-right">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="hover:bg-primary/10 h-7 w-7 cursor-pointer p-0"
                                                                                    onClick={() => handleAdjust(item)}
                                                                                    title="Ajustar"
                                                                                >
                                                                                    <Edit className="text-primary h-3.5 w-3.5" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="hover:bg-primary/10 h-7 w-7 cursor-pointer p-0"
                                                                                    onClick={() => onPrint && onPrint({
                                                                                        id: item.estanteria_id,
                                                                                        nombre: item.estanteria_nombre,
                                                                                        bodega_id: item.bodega_id,
                                                                                        bodega_nombre: item.bodega_nombre,
                                                                                    })}
                                                                                    title="Imprimir"
                                                                                >
                                                                                    <Printer className="text-indigo-500 h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    )}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {!onAdjust && selectedShelf && (
                <AdjustmentModal
                    isOpen={adjustmentOpen}
                    onClose={() => setAdjustmentOpen(false)}
                    onSuccess={fetchDetails}
                    referencia={referencia}
                    estanteria={selectedShelf}
                    bodegas={bodegas}
                    items={details.filter((d) => d.estanteria_id === selectedShelf.id)}
                />
            )}

            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={closeViewer}
            />
        </>
    );
};
