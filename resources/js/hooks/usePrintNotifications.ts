import { getPrintRequestsRef, onValue, type PrintRequest } from '@/lib/firebase';
import { connectQZ, disconnectQZ } from '@/utils/qz-service';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export function usePrintNotifications(cuentaIdProp?: number | null, handlePrint?: (request: PrintRequest) => Promise<void>) {
    const [requests, setRequests] = useState<PrintRequest[]>([]);
    const { auth } = usePage().props as any;
    const processedKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
        const dbRef = getPrintRequestsRef(cuentaIdProp);
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setRequests([]);
                return;
            }

            const items: PrintRequest[] = [];
            if (cuentaIdProp) {
                Object.entries(data).forEach(([key, value]) => {
                    items.push({ ...(value as Omit<PrintRequest, 'key'>), key });
                });
            } else {
                Object.entries(data).forEach(([cId, requests]) => {
                    if (requests && typeof requests === 'object') {
                        Object.entries(requests as Record<string, any>).forEach(([key, value]) => {
                            items.push({ ...(value as Omit<PrintRequest, 'key'>), key, _cuentaId: Number(cId) } as any);
                        });
                    }
                });
            }

            items.sort((a, b) => b.created_at - a.created_at);
            setRequests(items);
        });

        return () => unsubscribe();
    }, [cuentaIdProp]);

    // Automatic printing logic
    useEffect(() => {
        if (!auth.user.impresion_principal || !auth.user.nombre_impresora || requests.length === 0 || !handlePrint) return;

        const processQueue = async () => {
            for (const request of requests) {
                if (request.key && !processedKeys.current.has(request.key)) {
                    processedKeys.current.add(request.key);
                    await handlePrint(request);
                }
            }
        };

        processQueue();
    }, [requests, auth.user.impresion_principal, auth.user.nombre_impresora, handlePrint]);

    // QZ Tray connection management
    useEffect(() => {
        if (auth.user.impresion_principal) {
            connectQZ().catch(() => { });
        }
        return () => {
            disconnectQZ().catch(() => { });
        };
    }, [auth.user.impresion_principal]);

    return { requests };
}
