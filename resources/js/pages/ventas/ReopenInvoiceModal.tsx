import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { useForm } from '@inertiajs/react';
import { AlertCircle, FileEdit } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { showAlert } from '@/plugins/sweetalert';

interface ReopenInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    facturaId: number;
    onSuccess: () => void;
}

export const ReopenInvoiceModal = ({ isOpen, onClose, facturaId, onSuccess }: ReopenInvoiceModalProps) => {
    const [loading, setLoading] = useState(false);
    const { data, setData, reset, errors, setError, clearErrors } = useForm({
        observacion: '',
    });

    useEffect(() => {
        if (isOpen) {
            reset();
            clearErrors();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (data.observacion.trim().length < 5) {
            setError('observacion', 'La observación debe tener al menos 5 caracteres.');
            return;
        }

        setLoading(true);

        try {
            await axios.post(route('api.ventas.reopen', { venta: facturaId }), data);
            showAlert('success', 'Factura reabierta correctamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error reabriendo factura:', error);
            showAlert('error', error.response?.data?.error || 'Ocurrió un error al intentar reabrir la factura');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} closeable={true} title="Reabrir Factura">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Atención: Acción Sensible</p>
                        <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
                            Estás a punto de reabrir la factura #{facturaId}. Esta acción quedará registrada en el historial de observaciones y modificará los reportes y bloqueos de inventario asociados.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Motivo de Reapertura <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Escribe aquí de manera detallada por qué necesitas reabrir esta factura..."
                        rows={4}
                        value={data.observacion}
                        onChange={(e) => {
                            setData('observacion', e.target.value);
                            clearErrors('observacion');
                        }}
                    />
                    {errors.observacion && (
                        <p className="text-xs text-red-500">{errors.observacion}</p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {loading ? 'Procesando...' : (
                            <>
                                <FileEdit className="mr-2 h-4 w-4" />
                                Confirmar y Reabrir
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
