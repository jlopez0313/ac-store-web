import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
import { createPrintRequest } from '@/lib/firebase';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowRight, RefreshCcw, Search as SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Cambios', href: route('cambios.index') },
];

export default function Index({ filters: initialFilters, cuentas, locals, current_cuenta }: any) {
    const { isSuperAdmin } = useAuth();
    const { auth } = usePage().props as any;

    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.cambios.index'), { params });
                setItems(response.data.data);
                setMeta(response.data.meta);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        },
        [filters],
    );

    const [searchQuery, setSearchQuery] = useState(filters.search);

    // Debounced automatic search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== filters.search) {
                handleSearch(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page, filters.search]);

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
    };

    const columns = [
        {
            name: 'ID',
            selector: (row: any) => row.id,
            sortable: true,
            width: '70px',
        },
        {
            name: 'Fecha',
            selector: (row: any) =>
                row.fecha
                    ? new Date(row.fecha).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : '-',
            sortable: true,
        },
        {
            name: 'Local',
            selector: (row: any) => row.local?.name,
            sortable: true,
        },
        {
            name: 'Original',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">Factura #{row.venta_id}</span>
                    <span className="text-[10px] font-bold text-red-500 uppercase">
                        -{row.detalle_original?.producto?.codigo}
                        <span className="ml-1 text-slate-400">(Talla: {row.detalle_original?.talla})</span>
                    </span>
                </div>
            ),
        },
        {
            name: 'Cambio por',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <div className="flex flex-col">
                        <span className="font-bold text-green-600">{row.producto_nuevo?.codigo}</span>
                        <span className="text-[10px] text-slate-500">Talla: {row.talla_nueva}</span>
                    </div>
                </div>
            ),
        },
        {
            name: 'Diferencia',
            cell: (row: any) => (
                <Badge
                    variant={row.diferencia > 0 ? 'default' : 'outline'}
                    className={row.diferencia > 0 ? 'border-amber-200 bg-amber-100 text-amber-700' : ''}
                >
                    ${Number(row.diferencia).toLocaleString()}
                </Badge>
            ),
        },
        {
            name: 'Registrado por',
            selector: (row: any) => row.creado_por_name || 'N/A',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cambios" />

            <div className="p-4 space-y-6">
                <PageHeader title="Gestión de Cambios" description="Historial de devoluciones y cambios de productos." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-md gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por ID, local, observación..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={() => setShow(true)}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Registrar Cambio
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        processing={loading}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => setFilters((prev) => ({ ...prev, page }))}
                        setPageSize={(size) => setFilters((prev) => ({ ...prev, per_page: size, page: 1 }))}
                        onSort={(column: any, sortOrder) => {
                            setFilters((prev) => ({
                                ...prev,
                                sort_field: column.sortField,
                                sort_order: sortOrder,
                                page: 1,
                            }));
                        }}
                    />
                </div>
            </div>

            <Modal show={show} onClose={() => setShow(false)} closeable={true} title="Registrar Nuevo Cambio" maxWidth="4xl">
                <Form
                    cuentas={cuentas}
                    current_cuenta={current_cuenta}
                    locals={locals}
                    processing={loading}
                    onClose={() => setShow(false)}
                    onStore={async (data: any) => {
                        try {
                            const response = await axios.post(route('api.cambios.store'), data);
                            const cambio = response.data.data;

                            // Trigger print request
                            const cuentaId = cambio.cuenta?.id || auth.user.cuenta_id;
                            if (cuentaId) {
                                createPrintRequest(cuentaId, {
                                    venta_id: cambio.venta_id,
                                    local_name: cambio.local?.name || auth.user.name,
                                    type: 'cambio',
                                    ids: [cambio.id],
                                }).catch((err) => console.error('Error creating change print request:', err));
                            }

                            setShow(false);
                            fetchData();
                        } catch (error: any) {
                            console.error('Error storing change:', error);
                            throw error;
                        }
                    }}
                    onReload={() => fetchData()}
                />
            </Modal>
        </AppLayout>
    );
}
