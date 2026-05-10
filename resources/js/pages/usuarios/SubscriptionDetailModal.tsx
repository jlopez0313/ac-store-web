import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Save } from "lucide-react";

interface Props {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function SubscriptionDetailModal({ user, open, onOpenChange, onSuccess }: Props) {
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [editingPrices, setEditingPrices] = useState<any>({});

    useEffect(() => {
        if (open && user) {
            fetchDetail();
        }
    }, [open, user]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/usuarios/${user.id}/subscription-detail`);
            setDetail(res.data.detail);
            setTotal(res.data.total);
            
            // Map current prices to editing state
            const prices: any = {};
            res.data.detail.forEach((item: any) => {
                prices[item.cuenta_id] = item.custom_price || '';
            });
            setEditingPrices(prices);
        } catch (error) {
            toast.error("Error al cargar el detalle de suscripción");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrice = async (cuentaId: number) => {
        try {
            const price = editingPrices[cuentaId] === '' ? null : Number(editingPrices[cuentaId]);
            await axios.post(`/api/usuarios/${user.id}/account-price`, {
                cuenta_id: cuentaId,
                custom_price: price
            });
            toast.success("Precio actualizado");
            fetchDetail();
            onSuccess();
        } catch (error) {
            toast.error("Error al actualizar precio");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Detalle de Cobro: {user?.name}
                    </DialogTitle>
                    <DialogDescription>
                        Desglose de los valores cobrados por cada cuenta/empresa.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-10 text-center text-muted-foreground">Cargando detalle...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cuenta / Empresa</TableHead>
                                        <TableHead className="text-right">Precio Estándar</TableHead>
                                        <TableHead className="text-right w-40">Precio Personalizado</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detail.map((item: any) => (
                                        <TableRow key={item.cuenta_id}>
                                            <TableCell>
                                                <div className="font-medium">{item.cuenta_nombre}</div>
                                                {item.is_primary && <Badge variant="secondary" className="text-[0.6rem] h-4 mt-1">Cuenta Principal</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground line-through decoration-muted-foreground/30">
                                                ${item.default_price.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input 
                                                    type="number" 
                                                    className="h-8 text-right font-bold text-primary"
                                                    value={editingPrices[item.cuenta_id]}
                                                    onChange={e => setEditingPrices({...editingPrices, [item.cuenta_id]: e.target.value})}
                                                    placeholder={item.default_price.toString()}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-primary"
                                                    onClick={() => handleUpdatePrice(item.cuenta_id)}
                                                >
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <div>
                                <p className="text-sm font-medium">Total Mensual Proyectado</p>
                                <p className="text-xs text-muted-foreground">Suma de todos los precios (estándar o personalizados).</p>
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                ${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
