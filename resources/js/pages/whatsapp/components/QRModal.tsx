import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface QRModalProps {
    show: boolean;
    onClose: () => void;
    apiUrl: string;
    userId: number;
}

export function QRModal({ show, onClose, apiUrl, userId }: QRModalProps) {
    return (
        <Modal closeable show={show} onClose={onClose} title="Vincular WhatsApp" maxWidth="md">
            <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700 shadow-inner">
                    <img
                        src={`${apiUrl}/${userId}/qr?t=${new Date().getTime()}`}
                        alt="QR Code"
                        className="w-64 h-64 rounded-lg shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/256x256?text=Cargando+QR...';
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Escanea este código con tu aplicación de WhatsApp para vincular tu cuenta.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Esperando vinculación...
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </Modal>
    );
}
