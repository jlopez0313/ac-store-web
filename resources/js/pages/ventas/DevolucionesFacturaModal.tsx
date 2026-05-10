import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import axios from 'axios';
import { ImageIcon, Loader2, PackageX } from 'lucide-react';
import { ViewerModal } from '@/components/ui/ViewerModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    facturaId: number | null;
    facturaCodigo?: string | number;
}

export const DevolucionesFacturaModal: React.FC<Props> = ({ isOpen, onClose, facturaId, facturaCodigo }) => {
    const [devoluciones, setDevoluciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && facturaId) {
            setLoading(true);
            axios.get(route('api.devoluciones.index'), { params: { venta_id: facturaId, per_page: 100 } })
                .then(res => setDevoluciones(res.data.data || []))
                .catch(() => setDevoluciones([]))
                .finally(() => setLoading(false));
        } else {
            setDevoluciones([]);
        }
    }, [isOpen, facturaId]);

    const total = devoluciones.reduce((acc, d) => acc + Number(d.subtotal || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackageX className="h-5 w-5 text-red-500" />
                        Devoluciones — Factura{facturaCodigo ? ` #${facturaCodigo}` : ''}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : devoluciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <PackageX className="mb-3 h-10 w-10" />
                            <p className="text-sm">Esta factura no tiene devoluciones registradas.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Foto</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Talla</TableHead>
                                        <TableHead>Bodega</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                        <TableHead className="text-right">P. Unit.</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Devuelto por</TableHead>
                                        <TableHead>Observación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devoluciones.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell>
                                                <div 
                                                    onClick={() => d.producto?.foto && setViewerImage(`/storage/${d.producto.foto}`)}
                                                    className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded border border-border bg-muted ${d.producto?.foto ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                                                >
                                                    {d.producto?.foto ? (
                                                        <img
                                                            src={`/storage/${d.producto.foto}`}
                                                            alt={d.producto.codigo}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-4 w-4 text-slate-300" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">{d.producto?.codigo ?? 'N/A'}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{d.producto?.descripcion ?? 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{d.talla}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">{d.bodega?.nombre ?? 'N/A'}</TableCell>
                                            <TableCell className="text-right font-bold">{d.cantidad}</TableCell>
                                            <TableCell className="text-right">${Number(d.precio_unitario || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                ${Number(d.subtotal || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-xs text-slate-500">
                                                {d.fecha_devolucion ? new Date(d.fecha_devolucion).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{d.eliminador?.name ?? 'Sistema'}</TableCell>
                                            <TableCell className="max-w-[150px] truncate text-xs text-slate-500">{d.observacion ?? '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 border-t pt-3 px-1 flex justify-between items-center">
                                <span className="text-sm text-slate-500">{devoluciones.length} devolución(es)</span>
                                <span className="text-lg font-bold text-red-600">
                                    Total devuelto: ${total.toLocaleString()}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </div>
            </DialogContent>
            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={() => setViewerImage(null)}
            />
        </Dialog>
    );
};
