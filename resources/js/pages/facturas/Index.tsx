import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { DollarSign, Eye, Package, Search as SearchIcon, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Sub-components
import { DetailModal } from './DetailModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Facturas', href: route('facturas.index') },
];

export default function Index({ filters: initialFilters }: any) {
    const { auth } = usePage().props as any;
    const isSuper = auth.user.role === 'superadmin';

    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25, gran_total: 0, gran_total_items: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        desde: initialFilters?.desde || '',
        hasta: initialFilters?.hasta || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
        tab: initialFilters?.tab || 'todas',
        sort_field: initialFilters?.sort_field || 'id',
        sort_order: initialFilters?.sort_order || 'desc',
    });

    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [selectedFactura, setSelectedFactura] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(
        async () => {
            setLoading(true);
            try {
                const response = await axios.get(route('api.facturas.index'), { params: filters });
                const items = response.data.data;
                setData(items);
                setMeta(response.data.meta);

                // Auto-open modal if search matches a single record and we haven't opened it yet
                if (filters.search && items.length > 0) {
                    const found = items.find((f: any) => f.id == filters.search || f.numero == filters.search);
                    if (found && !isModalOpen) {
                        setSelectedFactura(found);
                        setIsModalOpen(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {
                setLoading(false);
            }
        },
        [filters, isModalOpen],
    );

    // Debounced automatic search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== filters.search) {
                handleSearch();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue]);

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page, filters.tab, filters.sort_field, filters.sort_order, filters.search, filters.desde, filters.hasta]);

    const handleViewInvoice = (id: number) => {
        setIsModalOpen(false);
        setSearchValue(id.toString());
        setFilters((prev) => ({ ...prev, search: id.toString(), page: 1 }));
    };

    const tabs = [
        { id: 'todas', label: 'Todas' },
        { id: 'abiertas', label: 'Abiertas' },
        { id: 'cerradas', label: 'Cerradas' },
        { id: 'pendientes', label: 'Pendientes' },
        { id: 'sin_precio', label: 'Sin Precio' },
    ];

    const handleSearch = (tab?: string) => {
        const newTab = tab || filters.tab;
        setFilters((prev) => ({ ...prev, search: searchValue, tab: newTab, page: 1 }));
    };

    const handleClear = () => {
        setSearchValue('');
        setFilters({
            search: '',
            desde: '',
            hasta: '',
            per_page: 25,
            page: 1,
            tab: 'todas',
            sort_field: 'id',
            sort_order: 'desc',
        });
    };

    const columns = [
        {
            name: 'ID',
            selector: (row: any) => row.id,
            sortable: true,
            sortField: 'id',
            width: '80px',
        },
        {
            name: 'Código',
            selector: (row: any) => row.numero || '-',
            sortable: true,
            sortField: 'numero',
            width: '100px',
            cell: (row: any) => (
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {row.numero || '-'}
                </span>
            ),
        },
        ...(isSuper ? [{
            name: 'Cuenta',
            selector: (row: any) => row.cuenta || 'N/A',
            sortable: true,
            sortField: 'cuenta_id',
        }] : []),
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha || '-',
            sortable: true,
            sortField: 'created_at',
        },
        {
            name: 'Creado Por',
            selector: (row: any) => row.vendedor || '-',
            sortable: true,
            sortField: 'usuario_id',
            minWidth: '150px',
        },
        {
            name: 'Local',
            selector: (row: any) => row.local?.name || 'N/A',
            sortable: true,
            sortField: 'comercio_id',
            minWidth: '200px',
        },
        {
            name: 'Bodega',
            selector: (row: any) => row.bodega?.nombre || 'N/A',
        },
        {
            name: 'Items',
            selector: (row: any) => row.items_count || 0,
            sortable: true,
            sortField: 'total_cantidad',
            width: '100px',
            center: true,
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold">{row.items_count || 0}</span>
                </div>
            )
        },
        {
            name: 'Saldo',
            selector: (row: any) => row.total || 0,
            sortable: true,
            sortField: 'total',
            cell: (row: any) => (
                <span className="font-bold text-slate-900 dark:text-white">
                    ${Number(row.total || 0).toLocaleString()}
                </span>
            ),
        },
        {
            name: 'Días',
            selector: (row: any) => row.diferencia_dias || 0,
            sortable: true,
            width: '80px',
            center: true,
            cell: (row: any) => {
                const dias = row.diferencia_dias || 0;
                return (
                    <span className={`font-medium ${dias > 15 ? 'text-red-500' : 'text-slate-500'}`}>
                        {dias}
                    </span>
                );
            }
        },
        {
            name: 'Estado',
            selector: (row: any) => row.estado,
            sortable: true,
            sortField: 'estado',
            cell: (row: any) => (
                <Badge
                    variant="outline"
                    className={cn(
                        'capitalize',
                        row.estado === 'cerrada' ? 'badge-closed' : 'badge-open'
                    )}
                >
                    {row.estado}
                </Badge>
            ),
        },
    ];

    const actions = [
        {
            title: 'Ver detalle',
            icon: Eye,
            action: (id: any) => {
                const row = data.find((r: any) => r.id === id);
                if (row) {
                    setSelectedFactura(row);
                    setIsModalOpen(true);
                }
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Facturas" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <PageHeader title="Gestión de Facturas" description="Historial de facturas de venta." />

                    <div className="flex flex-wrap items-center gap-4 self-end md:self-start">
                        <div className="flex items-center gap-5 rounded-md border border-slate-200 bg-white px-5 py-3 shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900">
                                <DollarSign className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="mb-1.5 text-[10px] leading-none font-medium text-slate-400 uppercase dark:text-slate-500">
                                    Total Acumulado
                                </p>
                                <p className="text-xl leading-none font-bold tracking-tighter text-slate-900 dark:text-white">
                                    ${Number(meta.gran_total || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 rounded-md border border-slate-200 bg-white px-5 py-3 shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900">
                                <Package className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="mb-1.5 text-[10px] leading-none font-medium text-slate-400 uppercase dark:text-slate-500">
                                    Total de Items
                                </p>
                                <p className="text-xl leading-none font-bold tracking-tighter text-slate-900 dark:text-white">
                                    {Number(meta.gran_total_items || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-end">
                    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-end">
                        <div className="flex max-w-md flex-1 items-center gap-2">
                            <div className="relative flex-1">
                                <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    id="search-input"
                                    placeholder="Buscar por ID, vendedor, local..."
                                    className="pl-9"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="desde" className="text-[10px] font-bold uppercase text-slate-400">Desde</Label>
                                <Input
                                    id="desde"
                                    type="date"
                                    className="h-9 w-36"
                                    value={filters.desde}
                                    onChange={(e) => setFilters(prev => ({ ...prev, desde: e.target.value, page: 1 }))}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="hasta" className="text-[10px] font-bold uppercase text-slate-400">Hasta</Label>
                                <Input
                                    id="hasta"
                                    type="date"
                                    className="h-9 w-36"
                                    value={filters.hasta}
                                    onChange={(e) => setFilters(prev => ({ ...prev, hasta: e.target.value, page: 1 }))}
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleClear}
                                size="icon"
                                className="mt-auto h-9 w-9 text-slate-400 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                                title="Limpiar filtros"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border rounded-lg h-fit">
                        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleSearch(tab.id)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${filters.tab === tab.id
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

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
                        fetchPage={(page) => setFilters((prev) => ({ ...prev, page }))}
                        setPageSize={(per_page) => setFilters((prev) => ({ ...prev, per_page, page: 1 }))}
                        onSort={(column: any, sortOrder) => {
                            setFilters((prev) => ({
                                ...prev,
                                sort_field: column.sortField,
                                sort_order: sortOrder,
                                page: 1,
                            }));
                        }}
                        actions={actions as any}
                    />
                </div>
            </div>

            <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} factura={selectedFactura} onViewInvoice={handleViewInvoice} />
        </AppLayout>
    );
}
