import { removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { handlePrintCambio } from '../components/print/actions/printCambio';
import { handlePrintDevolucion } from '../components/print/actions/printDevolucion';
import { handlePrintStickers } from '../components/print/actions/printStickers';
import { handlePrintTraslado } from '../components/print/actions/printTraslado';
import { handlePrintVenta } from '../components/print/actions/printVenta';

export function usePrintAction(cuentaIdProp?: number | null) {
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const { auth } = usePage().props as any;
    const activePrints = useRef<Set<string>>(new Set());

    const handlePrint = async (request: PrintRequest) => {
        const effectiveCuentaId = cuentaIdProp || (request as any)._cuentaId;
        
        // Lock key to prevent double printing if multiple notifications arrive for the same entity
        // For stickers, use the unique request key to avoid blocking independent batches
        const entityId = request.type === 'stickers' ? request.key : (request.venta_id || request.traslado_id || 'manual');
        const lockKey = `${request.type}:${entityId}`;
        
        if (activePrints.current.has(lockKey)) {
            console.warn(`[PRINT LOCK] Already printing ${lockKey}, skipping duplicate request.`);
            if (request.key) {
                await removePrintRequest(effectiveCuentaId, request.key);
            }
            return;
        }

        activePrints.current.add(lockKey);
        setProcessingKey(request.key || null);
        
        try {
            switch (request.type) {
                case 'pendientes':
                case 'cuadre':
                case 'factura':
                    await handlePrintVenta(request, auth, effectiveCuentaId);
                    break;
                
                case 'devolucion':
                    await handlePrintDevolucion(request, auth, effectiveCuentaId);
                    break;
                
                case 'cambio':
                    await handlePrintCambio(request, auth, effectiveCuentaId);
                    break;
                
                case 'stickers':
                    await handlePrintStickers(request, auth, effectiveCuentaId);
                    break;
                
                case 'traslado':
                    await handlePrintTraslado(request, auth);
                    break;

                default:
                    console.warn('Unknown print request type:', request.type);
            }

            // Cleanup request from Firebase if successfully handled
            if (request.key) {
                await removePrintRequest(effectiveCuentaId, request.key);
            }
        } catch (error: any) {
            console.error('Error al imprimir:', error);
            showAlert('error', 'Error al imprimir: ' + (error.message || 'Verifique la conexión de la impresora.'));
        } finally {
            activePrints.current.delete(lockKey);
            setProcessingKey(null);
        }
    };

    return { handlePrint, processingKey };
}
