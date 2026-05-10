import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface Props {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function RegisterPaymentModal({ user, open, onOpenChange, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: user?.precio_suscripcion || 0,
        payment_date: new Date().toISOString().split('T')[0],
        next_cutoff_date: '',
        observations: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`/api/usuarios/${user.id}/register-payment`, form);
            toast.success("Pago registrado correctamente");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al registrar pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Registra el pago mensual para el usuario <strong>{user?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor Pagado</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                value={form.amount} 
                                onChange={e => setForm({...form, amount: Number(e.target.value)})} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_date">Fecha de Pago</Label>
                            <Input 
                                id="payment_date" 
                                type="date" 
                                value={form.payment_date} 
                                onChange={e => setForm({...form, payment_date: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="next_cutoff_date">Fecha Próximo Corte</Label>
                        <Input 
                            id="next_cutoff_date" 
                            type="date" 
                            value={form.next_cutoff_date} 
                            onChange={e => setForm({...form, next_cutoff_date: e.target.value})} 
                            required
                        />
                        <p className="text-xs text-muted-foreground">Esta fecha actualizará el vencimiento del usuario.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea 
                            id="observations" 
                            value={form.observations} 
                            onChange={e => setForm({...form, observations: e.target.value})} 
                            placeholder="Eje: Pago transferencia Bancolombia..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Registrando..." : "Confirmar Pago"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
