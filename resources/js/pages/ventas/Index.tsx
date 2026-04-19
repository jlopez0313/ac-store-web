import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import { type BreadcrumbItem } from '@/types';
import { printReceipts } from '@/utils/printReceipt';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Plus, ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AddDetailModal } from './AddDetailModal';
import { CreateModal } from './CreateModal';

// Sub-components
import { InvoiceDetailHeader } from './InvoiceDetailHeader';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceList } from './InvoiceList';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Ventas', href: route('ventas.index') },
];

export default function Index({ filters: initialFilters, lista, cuentas, referencias, bodegas, bodega_accesos, locals, next_id }: any) {
    const { auth } = usePage().props as any;
    const isAdmin = ['admin', 'bodega', 'superadmin'].includes(auth.user.role);

    const [facturas, setFacturas] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
    });

    const [selectedFactura, setSelectedFactura] = useState<any>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedRef, setSelectedRef] = useState<any>(null);
    const [selectedDetailIds, setSelectedDetailIds] = useState<number[]>([]);

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.ventas.index'), { params });
                const data = response.data.data;
                setFacturas(data);
                setMeta(response.data.meta);

                // Auto-select first or search result if needed
                if (params.search && data.length > 0) {
                    const found = data.find((f: any) => f.id == params.search);
                    if (found) setSelectedFactura(found);
                } else if (selectedFactura) {
                    const updated = data.find((f: any) => f.id == selectedFactura.id);
                    if (updated) setSelectedFactura(updated);
                }
            } catch (error) {
                console.error('Error fetching sales:', error);
            } finally {
                setLoading(false);
            }
        },
        [filters, selectedFactura],
    );

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page]);

    const handleSearch = (value: string) => {
        setFilters((prev) => ({ ...prev, search: value, page: 1 }));
        fetchData({ search: value, page: 1 });
    };

    const handleDeleteDetail = async (detalleId: number) => {
        const result = await confirmDialog({
            title: '¿Motivo de la devolución?',
            input: 'textarea',
            inputPlaceholder: 'Escribe el motivo de la devolución aquí...',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value: string) => {
                if (!value) return 'Debes proporcionar una observación';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.delete(
                route('api.ventas.detalles.delete', {
                    venta: selectedFactura.id,
                    detalle: detalleId,
                }),
                { params: { observacion: result.value } },
            );
            setSelectedFactura({ ...selectedFactura, detalles: response.data.data });
            showAlert('success', 'Producto eliminado y stock restaurado.');
            fetchData(); // Refresh list to update totals/badges
        } catch (error: any) {
            showAlert('error', error.response?.data?.error || 'Error al eliminar el detalle.');
        }
    };

    const handleUpdatePrice = async (detalle: any) => {
        const result = await confirmDialog({
            title: 'Ajustar Precio',
            input: 'number',
            //@ts-ignore
            inputLabel: 'Nuevo precio unitario',
            inputValue: detalle.precio_unitario,
            confirmButtonText: 'Actualizar',
            inputValidator: (value: string) => {
                if (!value || isNaN(parseFloat(value))) return 'Debes ingresar un precio válido';
                return null;
            },
        });

        if (result.isConfirmed && result.value) {
            try {
                const response = await axios.put(route('api.ventas.detalles.update', { venta: selectedFactura.id, detalle: detalle.id }), {
                    precio_unitario: parseFloat(result.value),
                });
                setSelectedFactura({ ...selectedFactura, detalles: response.data.data });
                showAlert('success', 'Precio actualizado correctamente');
                fetchData();
            } catch (error: any) {
                showAlert('error', error.response?.data?.error || 'Error al actualizar precio');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDetailIds.length === 0) return;

        const result = await confirmDialog({
            title: '¿Motivo de las devoluciones?',
            text: `Se eliminarán ${selectedDetailIds.length} productos.`,
            input: 'textarea',
            inputPlaceholder: 'Escribe el motivo de la devolución aquí...',
            confirmButtonText: 'Eliminar seleccionados',
            inputValidator: (value: string) => {
                if (!value) return 'Debes proporcionar una observación';
                return null;
            },
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.delete(route('api.ventas.detalles.bulk_delete', { venta: selectedFactura.id }), {
                    data: { ids: selectedDetailIds, observacion: result.value },
                });
                setSelectedFactura({ ...selectedFactura, detalles: response.data.data });
                setSelectedDetailIds([]);
                showAlert('success', 'Productos eliminados correctamente');
                fetchData();
            } catch (error: any) {
                showAlert('error', error.response?.data?.error || 'Error al eliminar productos');
            }
        }
    };

    const handleCloseFactura = async () => {
        const result = await confirmDialog({
            title: '¿Cerrar factura?',
            text: '¿Estás seguro de cerrar esta factura? Ya no podrás agregar o quitar productos.',
            icon: 'question',
        });

        if (!result.isConfirmed) return;

        try {
            await axios.post(route('api.ventas.cerrar', { venta: selectedFactura.id }));
            setSelectedFactura({ ...selectedFactura, estado: 'cerrada' });
            showAlert('success', 'Factura cerrada correctamente.');
            fetchData();
        } catch (error: any) {
            showAlert('error', error.response?.data?.error || 'No se pudo cerrar la factura.');
        }
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ventas" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <PageHeader title="Módulo de Ventas" description="Gestión de facturación a locales y control de salidas de inventario." />
                    <div className="flex items-center gap-4">
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Factura
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    <InvoiceList
                        invoices={facturas}
                        selectedFactura={selectedFactura}
                        onSelectInvoice={setSelectedFactura}
                        filters={filters}
                        onSearch={handleSearch}
                        loading={loading}
                        meta={meta}
                        onPageChange={(page: number) => setFilters((f) => ({ ...f, page }))}
                    />

                    <div className="space-y-6 lg:col-span-3">
                        {selectedFactura ? (
                            <>
                                <InvoiceDetailHeader
                                    factura={selectedFactura}
                                    isAdmin={isAdmin}
                                    isLocal={auth.user.role === 'local'}
                                    selectedDetailIds={selectedDetailIds}
                                    onBulkDelete={handleBulkDelete}
                                    onAddProduct={() => {
                                        setSelectedRef(null);
                                        setDetailModalOpen(true);
                                    }}
                                    onCloseFactura={handleCloseFactura}
                                    onPrint={async (type) => {
                                        const detalles = selectedFactura.detalles || [];
                                        let items: any[];

                                        if (type === 'pendientes') {
                                            items = detalles.filter((d: any) => !d.impreso);
                                            if (items.length === 0) {
                                                showAlert('info', 'No hay ítems pendientes por imprimir.');
                                                return;
                                            }
                                        } else {
                                            items = detalles;
                                        }

                                        printReceipts({
                                            facturaId: selectedFactura.id,
                                            localName: selectedFactura.local?.name || auth.user.name,
                                            items,
                                        });

                                        if (type === 'pendientes') {
                                            try {
                                                await axios.post(route('api.ventas.mark_printed', selectedFactura.id), {
                                                    detalle_ids: items.map((d: any) => d.id),
                                                });
                                                const updatedDetalles = detalles.map((d: any) =>
                                                    items.find((i: any) => i.id === d.id) ? { ...d, impreso: true } : d,
                                                );
                                                setSelectedFactura({ ...selectedFactura, detalles: updatedDetalles });
                                            } catch {
                                                showAlert('error', 'Error al marcar ítems como impresos.');
                                            }
                                        }
                                    }}
                                />

                                <InvoiceItemsTable
                                    factura={selectedFactura}
                                    isAdmin={isAdmin}
                                    bodegas={bodegas}
                                    selectedDetailIds={selectedDetailIds}
                                    onToggleSelectAll={() => {
                                        if (selectedDetailIds.length === (selectedFactura.detalles?.length || 0)) {
                                            setSelectedDetailIds([]);
                                        } else {
                                            setSelectedDetailIds(selectedFactura.detalles?.map((d: any) => d.id) || []);
                                        }
                                    }}
                                    onToggleSelectDetail={(id) => {
                                        setSelectedDetailIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
                                    }}
                                    onUpdatePrice={handleUpdatePrice}
                                    onDeleteDetail={handleDeleteDetail}
                                    onViewInvoice={(id) => handleSearch(id.toString())}
                                />
                            </>
                        ) : (
                            <Card className="flex h-[calc(100vh-22rem)] items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50 shadow-none dark:border-slate-700 dark:bg-slate-800/30">
                                <div className="mx-auto max-w-sm space-y-4 text-center">
                                    <div className="mx-auto flex h-24 w-24 rotate-3 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:shadow-black/30">
                                        <ShoppingCart className="h-10 w-10 text-slate-200 dark:text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">Comienza ahora</p>
                                        <p className="text-lg leading-tight font-bold text-slate-900 dark:text-white">
                                            Selecciona una factura de la lista para ver sus detalles o crear una nueva.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <CreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                accounts={cuentas}
                locals={locals}
                nextId={next_id}
                onSuccess={() => fetchData()}
            />

            <AddDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                referencia={selectedRef}
                factura={selectedFactura}
                bodegas={bodegas}
                bodega_accesos={bodega_accesos}
                onAdded={(updatedDetalles: any) => {
                    setSelectedFactura({ ...selectedFactura, detalles: updatedDetalles });
                    fetchData();
                }}
            />
        </AppLayout>
    );
}
