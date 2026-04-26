import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getPrintRequestsRef, onValue, removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildReceiptPageHtml, printReceipts } from '@/utils/printReceipt';
import { connectQZ, disconnectQZ, printWithQZ } from '@/utils/qz-service';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Bell, Loader2, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    cuentaId?: number | null;
}

export function PrintNotificationBell({ cuentaId }: Props) {
    const [requests, setRequests] = useState<PrintRequest[]>([]);
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const { auth } = usePage().props as any;
    const processedKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
        const dbRef = getPrintRequestsRef(cuentaId);
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setRequests([]);
                return;
            }

            const items: PrintRequest[] = [];
            if (cuentaId) {
                // Single cuenta: data is { key: request }
                Object.entries(data).forEach(([key, value]) => {
                    items.push({ ...(value as Omit<PrintRequest, 'key'>), key });
                });
            } else {
                // All cuentas: data is { cuentaId: { key: request } }
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
    }, [cuentaId]);

    // Automatic printing for impresion_principal
    useEffect(() => {
        if (!auth.user.impresion_principal || !auth.user.nombre_impresora || requests.length === 0) return;

        const latestRequest = requests[0];
        if (latestRequest.key && !processedKeys.current.has(latestRequest.key)) {
            processedKeys.current.add(latestRequest.key);
            handlePrint(latestRequest);
        }
    }, [requests, auth.user]);

    // Connect to QZ tray on mount if impresion_principal is active
    useEffect(() => {
        if (auth.user.impresion_principal) {
            connectQZ().catch(() => {});
        }
        return () => {
            disconnectQZ().catch(() => {});
        };
    }, [auth.user.impresion_principal]);

    const handlePrint = async (request: PrintRequest) => {
        const effectiveCuentaId = cuentaId || (request as any)._cuentaId;
        setProcessingKey(request.key || null);
        try {
            const response = await axios.get(route('api.ventas.index'), {
                params: { search: request.venta_id, per_page: 1 },
            });

            const venta = response.data.data?.[0];
            if (!venta) {
                showAlert('error', 'No se encontró la factura.');
                return;
            }

            const detalles = venta.detalles || [];

            if (request.type === 'pendientes') {
                const pendientes = detalles.filter((d: any) => !d.impreso);
                if (pendientes.length === 0) {
                    showAlert('info', 'No hay ítems pendientes por imprimir.');
                    if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
                    return;
                }

                if (auth.user.impresion_principal && auth.user.nombre_impresora) {
                    const pages = buildReceiptPageHtml({
                        facturaId: venta.id,
                        localName: venta.local?.name || '',
                        items: pendientes,
                    });
                    for (const pageHtml of pages) {
                        await printWithQZ(auth.user.nombre_impresora, pageHtml);
                    }
                } else {
                    printReceipts({
                        facturaId: venta.id,
                        localName: venta.local?.name || '',
                        items: pendientes,
                    });
                }

                await axios.post(route('api.ventas.mark_printed', venta.id), {
                    detalle_ids: pendientes.map((d: any) => d.id),
                });
            } else {
                const { printCuadre } = await import('@/utils/printCuadre');
                const html = printCuadre(
                    {
                        facturaId: venta.id,
                        localName: venta.local?.name || '',
                        vendedor: venta.vendedor || '',
                        items: detalles,
                    },
                    true,
                ) as string;

                if (auth.user.impresion_principal && auth.user.nombre_impresora) {
                    await printWithQZ(auth.user.nombre_impresora, html);
                } else {
                    printCuadre({
                        facturaId: venta.id,
                        localName: venta.local?.name || '',
                        vendedor: venta.vendedor || '',
                        items: detalles,
                    });
                }
            }

            if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
        } catch (error) {
            console.error('Error al imprimir:', error);
            showAlert('error', 'Error al procesar la solicitud de impresión.');
        } finally {
            setProcessingKey(null);
        }
    };

    if (requests.length === 0) {
        return (
            <div className="relative">
                <Bell className="text-muted-foreground h-4 w-4" />
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                        {requests.length}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                {requests.map((req) => (
                    <DropdownMenuItem
                        key={req.key}
                        onClick={() => handlePrint(req)}
                        disabled={processingKey !== null}
                        className="cursor-pointer gap-3 py-3"
                    >
                        {processingKey === req.key ? (
                            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-indigo-500" />
                        ) : (
                            <Printer className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                        )}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold">Solicitud de impresión</span>
                            <span className="text-muted-foreground text-[11px]">
                                Factura #{req.venta_id} — {req.local_name}
                            </span>
                            <span className="text-muted-foreground text-[10px] capitalize">{req.type}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
