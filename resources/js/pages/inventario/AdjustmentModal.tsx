import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    referencia: any;
    estanteria: {
        id: number;
        nombre: string;
        bodega_nombre: string;
    };
    items: any[]; // Sizes and current stocks for this shelf
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ isOpen, onClose, onSuccess, referencia, estanteria, items }) => {
    const [form, setForm] = useState({
        precio_compra: 0,
        precio_venta: 0,
        observacion: '',
        detalles: [] as { talla: string; stock: number }[],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && referencia) {
            let initialDetails: { talla: string; stock: number }[] = [];
            const jsonStr = referencia.categoria?.variaciones_json;

            if (jsonStr) {
                try {
                    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
                    if (Array.isArray(parsed)) {
                        initialDetails = parsed.map((item: any) => {
                            let sizeLabel = String(item);
                            if (typeof item === 'object' && item !== null) {
                                sizeLabel = String(item.text || item.nombre || item.talla || item.valor || Object.values(item)[0] || JSON.stringify(item));
                            }
                            // Buscar si existe en los items actuales
                            const existing = items.find(i => String(i.talla) === sizeLabel);
                            return {
                                talla: sizeLabel,
                                stock: existing ? Number(existing.stock) : 0
                            };
                        });
                    }
                } catch (e) {
                    console.error("Error parsing variations", e);
                }
            }

            if (initialDetails.length === 0) {
                initialDetails = items.map((item) => ({
                    talla: item.talla,
                    stock: item.stock,
                }));
            }

            setForm({
                precio_compra: items[0]?.precio_compra || referencia.precio_compra || 0,
                precio_venta: items[0]?.precio_venta || referencia.precio_venta || 0,
                observacion: '',
                detalles: initialDetails,
            });
        }
    }, [isOpen, items, referencia]);

    const handleStockChange = (talla: string, value: string) => {
        const newStock = parseInt(value) || 0;
        setForm((prev) => ({
            ...prev,
            detalles: prev.detalles.map((d) => (d.talla === talla ? { ...d, stock: newStock } : d)),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(route('api.inventario.ajustar'), {
                referencia_id: referencia.id,
                estanteria_id: estanteria.id,
                precio_compra: form.precio_compra,
                precio_venta: form.precio_venta,
                observacion: form.observacion,
                detalles: form.detalles,
            });
            showAlert('success', 'Inventario ajustado correctamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adjusting inventory:', error);
            showAlert('error', error.response?.data?.message || 'No se pudo ajustar el inventario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} title="Ajustar Inventario" maxWidth="3xl" closeable={true}>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="bg-muted/30 border-border space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Producto</span>
                        <span className="font-semibold">
                            {referencia.codigo} - {referencia.descripcion}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Ubicación</span>
                        <span className="font-semibold">
                            {estanteria.bodega_nombre} / {estanteria.nombre}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="precio_compra">Precio de Compra</Label>
                        <Input
                            id="precio_compra"
                            type="number"
                            value={form.precio_compra}
                            onChange={(e) => setForm({ ...form, precio_compra: Number(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="precio_venta">Precio de Venta</Label>
                        <Input
                            id="precio_venta"
                            type="number"
                            value={form.precio_venta}
                            onChange={(e) => setForm({ ...form, precio_venta: Number(e.target.value) })}
                            required
                        />
                    </div>
                </div>

                <div className="border-border overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-center">Talla</TableHead>
                                <TableHead className="text-center">Cantidad Actual</TableHead>
                                <TableHead className="w-40 text-center">Nueva Cantidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {form.detalles.map((det) => (
                                <TableRow key={det.talla}>
                                    <TableCell className="text-center font-bold">{det.talla}</TableCell>
                                    <TableCell className="text-center">{det.stock}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-center"
                                            value={det.stock}
                                            onChange={(e) => handleStockChange(det.talla, e.target.value)}
                                            min="0"
                                            required
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="observacion">Observación / Motivo del Ajuste</Label>
                    <Textarea
                        id="observacion"
                        placeholder="Escriba aquí el motivo del ajuste..."
                        value={form.observacion}
                        onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading} className="gap-2">
                        <Save className="h-4 w-4" />
                        Guardar Ajuste
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
