import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BarChart3, Calendar, Eye, ImageIcon, MapPin, Package, RefreshCw, Search, ShoppingCart, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Reporte de Ventas', href: route('reportes.ventas') },
];

export default function Ventas({ cuentas, locales }: any) {
    const { auth }: any = usePage().props;
    const isSuper = auth.user.role === 'superadmin';

    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        desde: today,
        hasta: today,
        local_id: '',
        cuenta_id: 'all',
    });

    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25, total_facturas: 0, total_ventas: 0, total_productos: 0 });
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState({ column: 'id', direction: 'desc' });

    // Invoice details modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [invoiceDetails, setInvoiceDetails] = useState<any[]>([]);
    const [detailsMeta, setDetailsMeta] = useState<any>({ total: 0, current_page: 1, per_page: 10 });
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Returns modal
    const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
    const [returnsData, setReturnsData] = useState<any[]>([]);
    const [loadingReturns, setLoadingReturns] = useState(false);

    const fetchData = useCallback(async (params: any = {}) => {
        setLoading(true);
        try {
            const fetchParams = {
                ...filters,
                sort_by: params.sort_by || sort.column,
                sort_dir: params.sort_dir || sort.direction,
                ...params
            };
            const response = await axios.get(route('api.reportes.ventas'), {
                params: fetchParams,
            });
            setData(response.data.data);
            setMeta(response.data.meta);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters, sort]);

    useEffect(() => {
        fetchData({ page: 1 });
    }, []);

    const handleSort = (column: any, direction: string) => {
        const sortColumn = column.sortField || column.id;
        setSort({ column: sortColumn, direction });
        fetchData({ page: 1, sort_by: sortColumn, sort_dir: direction });
    };

    const handleClear = () => {
        setFilters({ desde: today, hasta: today, local_id: '', cuenta_id: 'all' });
    };

    const fetchDetails = async (invoiceId: number, page: number = 1) => {
        setLoadingDetails(true);
        try {
            const response = await axios.get(route('api.ventas.detalles', { venta: invoiceId }), {
                params: { page, per_page: detailsMeta.per_page }
            });
            setInvoiceDetails(response.data.data);
            setDetailsMeta(response.data.meta);
        } catch (e) {
            console.error("Error fetching invoice details:", e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleViewDetails = (invoice: any) => {
        setSelectedInvoice(invoice);
        setIsDetailsModalOpen(true);
        fetchDetails(invoice.id, 1);
    };

    const handleViewReturns = async (invoice: any) => {
        setIsReturnsModalOpen(true);
        setLoadingReturns(true);
        try {
            const response = await axios.get(route('api.ventas.devoluciones', { venta: invoice.id }));
            setReturnsData(response.data.data);
        } catch (e) {
            console.error("Error fetching returns:", e);
        } finally {
            setLoadingReturns(false);
        }
    };

    const columns = [
        {
            name: 'Factura',
            selector: (row: any) => row.factura_numero,
            sortable: true,
            sortField: 'factura_numero',
            width: '120px',
            cell: (row: any) => <span className="font-bold text-indigo-600">{row.factura_numero}</span>,
        },
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha,
            sortable: true,
            sortField: 'fecha',
            width: '120px',
        },
        ...(isSuper ? [{
            name: 'Cuenta',
            selector: (row: any) => row.cuenta,
            width: '150px',
        }] : []),
        {
            name: 'Local',
            selector: (row: any) => row.local,
            sortable: true,
            sortField: 'local',
            grow: 1,
        },
        {
            name: 'Items',
            selector: (row: any) => row.items_count,
            sortable: true,
            sortField: 'items_count',
            width: '100px',
            center: true,
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold">{row.items_count}</span>
                </div>
            )
        },
        {
            name: 'Total Factura',
            selector: (row: any) => row.total,
            sortable: true,
            sortField: 'total',
            width: '150px',
            right: true,
            cell: (row: any) => (
                <span className="font-bold text-emerald-600">
                    ${Number(row.total || 0).toLocaleString()}
                </span>
            ),
        },
        {
            name: 'Acciones',
            width: '100px',
            center: true,
            cell: (row: any) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={() => handleViewDetails(row)}
                    title="Ver detalle"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            )
        }
    ];

    const detailColumns = [
        {
            name: 'Foto',
            width: '85px',
            cell: (row: any) => {
                const fotoUrl = row.producto?.foto;
                return (
                    <div
                        onClick={() => fotoUrl && setViewerImage(fotoUrl)}
                        className={`my-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-border bg-muted ${fotoUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    >
                        {fotoUrl ? (
                            <img src={fotoUrl} className="h-full w-full object-cover" />
                        ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                        )}
                    </div>
                );
            },
        },
        {
            name: 'Código',
            selector: (row: any) => row.producto?.codigo,
            width: '120px',
            cell: (row: any) => <span className="font-bold">{row.producto?.codigo}</span>,
        },
        {
            name: 'Descripción',
            selector: (row: any) => row.producto?.descripcion,
            grow: 1,
            wrap: true,
        },
        {
            name: 'Talla',
            selector: (row: any) => row.talla,
            width: '75px',
            center: true,
        },
        {
            name: 'Cant.',
            selector: (row: any) => row.cantidad,
            width: '70px',
            center: true,
        },
        {
            name: 'Precio',
            selector: (row: any) => row.precio_unitario,
            width: '110px',
            cell: (row: any) => `$${Number(row.precio_unitario || 0).toLocaleString()}`,
        },
        {
            name: 'Subtotal',
            selector: (row: any) => row.subtotal,
            width: '110px',
            cell: (row: any) => <span className="font-bold text-emerald-600">${Number(row.subtotal || 0).toLocaleString()}</span>,
        },
    ];

    const returnColumns = [
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha_devolucion ? new Date(row.fecha_devolucion).toLocaleDateString() : 'N/A',
            width: '120px',
        },
        {
            name: 'Producto',
            selector: (row: any) => row.producto?.codigo,
            width: '120px',
            cell: (row: any) => <span className="font-bold">{row.producto?.codigo}</span>,
        },
        {
            name: 'Talla',
            selector: (row: any) => row.talla,
            width: '75px',
            center: true,
        },
        {
            name: 'Cant.',
            selector: (row: any) => row.cantidad,
            width: '75px',
            center: true,
        },
        {
            name: 'Subtotal',
            selector: (row: any) => row.subtotal,
            right: true,
            cell: (row: any) => <span className="font-bold text-red-600">-${Number(row.subtotal || 0).toLocaleString()}</span>,
        },
    ];

    const ltrim = (str: string, char: string) => {
        if (!str) return '';
        return str.startsWith(char) ? str.substring(char.length) : str;
    };

    const asset = (path: string) => {
        return window.location.origin + '/' + path;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporte de Ventas" />

            <div className="space-y-6 p-4">
                <PageHeader
                    title="Reporte de Ventas"
                    description="Analiza las ventas en un rango de fechas con filtros detallados."
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-white shadow-md">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Facturas</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{Number(meta.total_facturas || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white shadow-md">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Productos</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{Number(meta.total_productos).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-600 text-white shadow-md">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Total</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">${Number(meta.total_ventas).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    }
                />

                {/* Filters */}
                <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
                            {isSuper && (
                                <div className="flex-1 min-w-[180px]">
                                    <SelectField
                                        name="cuenta_id"
                                        title="Cuenta"
                                        value={filters.cuenta_id}
                                        onChange={(val) => setFilters(p => ({ ...p, cuenta_id: val as string }))}
                                        lista={[{ id: 'all', nombre: 'Todas las cuentas' }, ...cuentas]}
                                        item={{ idx: 'id', value: 'nombre' }}
                                        error={undefined}
                                    />
                                </div>
                            )}

                            <div className="flex-1 min-w-[180px]">
                                <SelectField
                                    name="local_id"
                                    title="Local"
                                    value={filters.local_id}
                                    onChange={(val) => setFilters(p => ({ ...p, local_id: val as string }))}
                                    lista={[{ id: '', name: 'Todos los locales' }, ...locales]}
                                    item={{ idx: 'id', value: 'name' }}
                                    error={undefined}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="desde" className="text-[11px] font-bold uppercase text-slate-400">Desde</Label>
                                <Input
                                    id="desde"
                                    type="date"
                                    value={filters.desde}
                                    onChange={(e) => setFilters(p => ({ ...p, desde: e.target.value }))}
                                    className="h-10 w-40"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="hasta" className="text-[11px] font-bold uppercase text-slate-400">Hasta</Label>
                                <Input
                                    id="hasta"
                                    type="date"
                                    value={filters.hasta}
                                    onChange={(e) => setFilters(p => ({ ...p, hasta: e.target.value }))}
                                    className="h-10 w-40"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => fetchData({ page: 1 })}
                                    className="h-10 px-6 font-bold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="mr-2 h-4 w-4" />
                                    )}
                                    Buscar
                                </Button>
                                <Button variant="outline" onClick={handleClear} size="icon" className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all" title="Limpiar filtros">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={data}
                        columns={columns}
                        total={meta.total}
                        processing={loading}
                        serverSide={true}
                        paginationServer={true}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        fetchPage={(page) => fetchData({ page })}
                        setPageSize={(per_page) => fetchData({ per_page, page: 1 })}
                        onSort={handleSort}
                    />
                </div>
            </div>

            <Modal
                show={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title={`Detalle de Factura: ${selectedInvoice?.factura_numero}`}
                maxWidth="4xl"
            >
                <div className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Local</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{selectedInvoice?.local}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fecha</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedInvoice?.fecha}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                <Package className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Unidades</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedInvoice?.items_count} Items</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-emerald-50/30 p-3 dark:border-emerald-900/20 dark:bg-emerald-950/20">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70">Total Venta</span>
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">${Number(selectedInvoice?.total || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {selectedInvoice?.has_returns && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-400"
                                onClick={() => handleViewReturns(selectedInvoice)}
                            >
                                <RefreshCw className="h-4 w-4 text-orange-500" />
                                Ver Devoluciones de Factura
                            </Button>
                        </div>
                    )}

                    <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-700 dark:bg-slate-900">
                        <DataGrid
                            data={invoiceDetails}
                            columns={detailColumns}
                            total={detailsMeta.total}
                            processing={loadingDetails}
                            serverSide={true}
                            paginationServer={true}
                            currentPage={detailsMeta.current_page}
                            paginationPerPage={detailsMeta.per_page}
                            fetchPage={(page) => fetchDetails(selectedInvoice.id, page)}
                            onSort={() => { }}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={() => setIsDetailsModalOpen(false)}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                show={isReturnsModalOpen}
                onClose={() => setIsReturnsModalOpen(false)}
                title={`Devoluciones - Factura: ${selectedInvoice?.factura_numero}`}
                maxWidth="2xl"
            >
                <div className="space-y-4 p-6">
                    {returnsData.length > 0 ? (
                        <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <DataGrid
                                data={returnsData}
                                columns={returnColumns}
                                total={returnsData.length}
                                processing={loadingReturns}
                                onSort={() => { }}
                                fetchPage={() => { }}
                                setPageSize={() => { }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-900/50">
                            <RefreshCw className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm text-slate-400 font-medium">Esta factura no tiene devoluciones registradas.</p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsReturnsModalOpen(false)}>
                            Volver al detalle
                        </Button>
                    </div>
                </div>
            </Modal>

            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={() => setViewerImage(null)}
            />
        </AppLayout>
    );
}
