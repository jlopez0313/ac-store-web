import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import axios from 'axios';
import { Barcode, Edit, Info, Package, Tag, Warehouse } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { AdjustmentModal } from './AdjustmentModal';
import { ViewerModal } from '@/components/ui/ViewerModal';

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    referencia: any;
    onAdjust?: (shelf: any, details: any[]) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, referencia, onAdjust }) => {
    const [details, setDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [selectedShelf, setSelectedShelf] = useState<any>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const viewerOpenRef = useRef(false);

    const openViewer = (foto: string) => { viewerOpenRef.current = true; setViewerImage(foto); };
    const closeViewer = () => { viewerOpenRef.current = false; setViewerImage(null); };
    const handleModalClose = () => { if (!viewerOpenRef.current) onClose(); };

    useEffect(() => {
        if (isOpen && referencia) {
            fetchDetails();
        }
    }, [isOpen, referencia]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.inventario.detail', referencia.id));
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
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground mb-1 text-[10px] leading-none font-medium uppercase">Stock Total</span>
                                        <span
                                            className={`text-sm font-medium ${Number(referencia.total_stock) <= 0 ? 'text-red-500' : 'text-foreground'}`}
                                        >
                                            {referencia.total_stock} unidades
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!loading && details.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-foreground flex items-center gap-2 text-sm font-medium uppercase">Resumen por Bodega</h3>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(warehouseTotals).map(([bodega, total]: any) => (
                                        <div
                                            key={bodega}
                                            className="bg-background border-border flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-xs"
                                        >
                                            <div className="bg-primary/10 rounded-lg p-1.5">
                                                <Warehouse className="text-primary h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground mb-1 text-[10px] leading-none font-medium uppercase">
                                                    {bodega}
                                                </span>
                                                <span className="text-foreground text-xs leading-none font-medium">
                                                    {total} <span className="text-muted-foreground text-[10px] font-medium">unidades</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                <div className="bg-background border-border overflow-hidden rounded-2xl border shadow-sm">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                                            <TableRow>
                                                <TableHead className="text-foreground bg-muted/50 h-12 font-bold">Bodega / Estantería</TableHead>
                                                <TableHead className="text-foreground bg-muted/50 h-12 text-center font-bold">Talla</TableHead>
                                                <TableHead className="text-foreground bg-muted/50 h-12 text-center font-bold">Stock</TableHead>
                                                <TableHead className="text-foreground bg-muted/50 h-12 text-right font-bold">Precio Costo</TableHead>
                                                <TableHead className="text-foreground bg-muted/50 h-12 text-right font-bold">Precio Venta</TableHead>
                                                <TableHead className="text-foreground bg-muted/50 h-12 pr-6 text-right font-bold">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {details.map((item: any) => (
                                                <TableRow key={item.id} className="hover:bg-muted/20 border-border/50 transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-muted text-muted-foreground rounded-lg p-2">
                                                                <Warehouse className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-foreground text-sm font-medium">{item.bodega_nombre}</span>
                                                                <span className="text-muted-foreground text-[10px] uppercase">
                                                                    {item.estanteria_nombre}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="bg-background border-border font-mono">
                                                            {item.talla}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`font-bold ${item.stock <= 0 ? 'text-red-500' : 'text-foreground'}`}>
                                                            {item.stock}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-right font-medium">
                                                        ${Number(item.precio_compra).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-foreground text-right font-medium">
                                                        ${Number(item.precio_venta).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="hover:bg-primary/10 h-8 w-8 cursor-pointer p-0"
                                                                onClick={() => handleDownloadLabel(item)}
                                                                title="Descargar Etiqueta"
                                                            >
                                                                <Barcode className="h-4 w-4 text-emerald-600" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="hover:bg-primary/10 h-8 w-8 cursor-pointer p-0"
                                                                onClick={() => handleAdjust(item)}
                                                                title="Ajustar"
                                                            >
                                                                <Edit className="text-primary h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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
