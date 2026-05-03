import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SwitchField } from '@/components/ui/form/SwitchField';
import { Modal } from '@/components/ui/Modal';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

type AccesoModalProps = {
    isOpen: boolean;
    onClose: () => void;
    usuario: any;
    bodega: any;
    onSuccess: () => void;
};

export const AccesoModal = ({ isOpen, onClose, usuario, bodega, onSuccess }: AccesoModalProps) => {
    const [loading, setLoading] = useState(false);
    const { data, setData, reset } = useForm({
        can_view: false,
        can_order: false,
        descuento: 0,
    });

    useEffect(() => {
        if (isOpen && bodega) {
            setData({
                can_view: !!bodega.can_view,
                can_order: !!bodega.can_order,
                descuento: bodega.descuento || 0,
            });
        }
    }, [isOpen, bodega]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(route('usuarios.accesos.update', { usuario: usuario.id, bodega_id: bodega.id }), data);
            showAlert('success', 'Permisos actualizados');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error actualizando accesos:', error);
            showAlert('error', error.response?.data?.message || 'Error al actualizar permisos');
        } finally {
            setLoading(false);
        }
    };

    if (!bodega) return null;

    return (
        <Modal show={isOpen} onClose={onClose} closeable={true} title={`Permisos: ${bodega.nombre}`}>
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Usuario a configurar
                    </p>
                    <p className="font-semibold text-foreground">
                        {usuario.name} <span className="text-muted-foreground font-normal">({usuario.username})</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-card">
                        <SwitchField
                            name="can_view"
                            title="Ver Stock"
                            checked={data.can_view}
                            onChange={(checked) => setData('can_view', checked)}
                        />
                        <p className="text-sm text-muted-foreground mt-2 pl-12">
                            Permite al usuario ver la existencia de productos en esta bodega.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card">
                        <SwitchField
                            name="can_order"
                            title="Pedir Stock"
                            checked={data.can_order}
                            onChange={(checked) => setData('can_order', checked)}
                        />
                        <p className="text-sm text-muted-foreground mt-2 pl-12">
                            Permite al usuario realizar pedidos de traslados a esta bodega.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card">
                        <InputField
                            name="descuento"
                            title="Descuento Autorizado ($)"
                            type="number"
                            value={data.descuento}
                            onChange={(val) => setData('descuento', val as any)}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            Monto de descuento predeterminado al transferir de esta bodega a este local.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
