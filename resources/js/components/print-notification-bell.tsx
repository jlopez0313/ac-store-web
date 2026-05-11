import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getPrintRequestsRef, onValue, removePrintRequest, type PrintRequest } from '@/lib/firebase';
import { showAlert } from '@/plugins/sweetalert';
import { buildReceiptPageHtml, printReceipts } from '@/utils/printReceipt';
import { buildReturnPageHtml } from '@/utils/printReturn';
import { buildCambioPageHtml } from '@/utils/printCambio';
import { buildStickerPageHtml } from '@/utils/printStickers';
import { printSoporteVenta } from '@/utils/printSoporteVenta';
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

        const processQueue = async () => {
            // Process ALL pending requests that haven't been processed yet, one by one
            for (const request of requests) {
                if (request.key && !processedKeys.current.has(request.key)) {
                    processedKeys.current.add(request.key);
                    await handlePrint(request);
                }
            }
        };

        processQueue();
    }, [requests, auth.user.impresion_principal, auth.user.nombre_impresora]);

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
            const response = await axios.get(route('api.ventas.show', request.venta_id));
            const venta = response.data.data;

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
                    for (let i = 0; i < pages.length; i++) {
                        const item = pendientes[i];
                        await printWithQZ(auth.user.nombre_impresora, pages[i]);
                        await axios.post(route('api.ventas.mark_printed', venta.id), {
                            detalle_ids: [item.id],
                        });
                    }
                } else {
                    printReceipts({
                        facturaId: venta.id,
                        localName: venta.local?.name || '',
                        items: pendientes,
                    });
                    await axios.post(route('api.ventas.mark_printed', venta.id), {
                        detalle_ids: pendientes.map((d: any) => d.id),
                    });
                }
            } else if (request.type === 'cuadre') {
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
            } else if (request.type === 'devolucion') {
                const response = await axios.get(route('api.devoluciones.index'), {
                    params: { ids: request.ids || [] },
                });
                const returns = response.data.data;

                if (!returns || returns.length === 0) {
                    showAlert('info', 'No se encontraron los datos de la devolución.');
                    if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
                    return;
                }

                if (auth.user.impresion_principal && auth.user.nombre_impresora) {
                    const pages = buildReturnPageHtml({
                        localName: request.local_name,
                        items: returns,
                    });
                    for (let i = 0; i < pages.length; i++) {
                        await printWithQZ(auth.user.nombre_impresora, pages[i]);
                    }
                } else {
                    const { printReturns } = await import('@/utils/printReturn');
                    printReturns({
                        localName: request.local_name,
                        items: returns,
                    });
                }
            } else if (request.type === 'cambio') {
                const response = await axios.get(route('api.cambios.index'), {
                    params: { ids: request.ids || [] },
                });
                const cambios = response.data.data;

                if (!cambios || cambios.length === 0) {
                    showAlert('info', 'No se encontraron los datos del cambio.');
                    if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
                    return;
                }

                if (auth.user.impresion_principal && auth.user.nombre_impresora) {
                    const pages = buildCambioPageHtml({
                        localName: request.local_name,
                        items: cambios,
                    });
                    for (let i = 0; i < pages.length; i++) {
                        await printWithQZ(auth.user.nombre_impresora, pages[i]);
                    }
                } else {
                    const { printCambios } = await import('@/utils/printCambio');
                    printCambios({
                        localName: request.local_name,
                        items: cambios,
                    });
                }
            } else if (request.type === 'factura') {
                const soporteData = {
                    facturaId: venta.id,
                    localName: venta.local?.name || '',
                    vendedor: venta.vendedor || '',
                    items: detalles,
                };

                if (auth.user.impresion_principal && auth.user.nombre_impresora) {
                    const html = printSoporteVenta(soporteData, true) as string;
                    await printWithQZ(auth.user.nombre_impresora, html);
                } else {
                    printSoporteVenta(soporteData);
                }
            } else if (request.type === 'stickers') {
                const response = await axios.get(route('api.stickers.index'), {
                    params: { ids: request.ids || [] }
                });
                const stickers = response.data.data;

                if (!stickers || stickers.length === 0) {
                    showAlert('info', 'No se encontraron etiquetas pendientes.');
                    if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
                    return;
                }

                if (auth.user.impresion_principal && auth.user.nombre_impresora) {
                    const pages = buildStickerPageHtml(stickers);
                    for (const page of pages) {
                        await printWithQZ(auth.user.nombre_impresora, page);
                    }
                } else {
                    const pages = buildStickerPageHtml(stickers);
                    // For manual print, we'll open a window with all of them
                    const win = window.open('', '_blank');
                    if (win) {
                        win.document.write(pages.join('<div style="page-break-after:always"></div>'));
                        win.document.close();
                    }
                }

                // Mark as printed (this deletes them)
                await axios.post(route('api.stickers.mark_printed'), {
                    ids: stickers.map((s: any) => s.id)
                });
            }

            // Successfully printed everything, now remove the request
            if (request.key) await removePrintRequest(effectiveCuentaId, request.key);
        } catch (error: any) {
            console.error('Error al imprimir:', error);
            showAlert('error', 'Error al imprimir: ' + (error.message || 'Verifique la conexión de la impresora.'));
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
                    <Printer className="h-4 w-4" />
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
