import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { ArrowUpRight, Box, Search as SearchIcon, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Cardex', href: route('cardex.index') },
];

export default function Index({ filters: initialFilters }: any) {
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({
        total: 0,
        current_page: 1,
        per_page: 25,
        stats: { total_referencias: 0, total_bodega: 0, total_ventas: 0, total_entradas: 0 },
    });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
        tab: initialFilters?.tab || 'Todo',
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.cardex.index'), { params });
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
    }, [filters.page, filters.per_page, filters.tab, filters.search]);

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
    };

    const handleTabChange = (tab: string) => {
        setFilters((prev) => ({ ...prev, tab, page: 1 }));
    };

    const tabs = ['Todo', 'Más Tiempo en Bodega', 'Menos Tiempo en Bodega', 'Más Cantidad en Bodega', 'Menos Cantidad en Bodega', 'Agotado'];

    const columns = [
        {
            name: 'Referencia',
            cell: (row: any) => <span className="font-bold text-slate-900 dark:text-white">{row.referencia}</span>,
            sortable: true,
            sortField: 'codigo',
            width: '140px',
        },
        {
            name: 'Descripción',
            cell: (row: any) => <span className="line-clamp-2 text-xs text-slate-500 uppercase">{row.descripcion}</span>,
        },
        {
            name: 'Entradas',
            cell: (row: any) => <span className="text-sm font-semibold">{row.entradas.toLocaleString()}</span>,
            width: '120px',
        },
        {
            name: 'Ventas',
            cell: (row: any) => <span className="text-sm font-semibold text-slate-400">{row.ventas.toLocaleString()}</span>,
            width: '120px',
        },
        {
            name: 'Bodega',
            cell: (row: any) => (
                <Badge
                    variant="outline"
                    className={cn(
                        'w-16 justify-center font-bold',
                        row.bodega > 0 ? 'badge-open' : 'badge-closed text-red-500 border-red-200'
                    )}
                >
                    {row.bodega.toLocaleString()}
                </Badge>
            ),
            width: '110px',
        },
        {
            name: 'Días',
            cell: (row: any) => (
                <span className={cn(
                    'text-xs font-bold',
                    row.dias > 30 ? 'text-red-500' : 'text-slate-500'
                )}>
                    {row.dias}d
                </span>
            ),
            width: '80px',
        },
        {
            name: 'P. Costo',
            cell: (row: any) => <span className="text-xs text-slate-400">${row.p_costo.toLocaleString()}</span>,
            width: '120px',
        },
        {
            name: 'P. Venta',
            cell: (row: any) => <span className="text-sm font-bold text-indigo-600">${row.p_venta.toLocaleString()}</span>,
            width: '120px',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cardex / Stock Tracker" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <PageHeader
                        title="Cardex / Stock Tracker"
                        description={`${meta.stats.total_referencias} referencias · ${meta.stats.total_bodega} unid. en bodega`}
                    />

                    <div className="flex flex-wrap items-center gap-4">
                        <StatCard label="Total Entradas" value={meta.stats.total_entradas} icon={TrendingUp} />
                        <StatCard label="Total Ventas" value={meta.stats.total_ventas} icon={ArrowUpRight} />
                        <StatCard label="Total Bodega" value={meta.stats.total_bodega} icon={Box} />
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center dark:border-slate-700 dark:bg-slate-900">
                    <div className="max-w-md flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por código, descripción..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTabChange(t)}
                                className={`rounded-lg px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${filters.tab === t ? 'border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                {t === 'Todo' ? 'Ver Todo' : t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
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
                        onSort={() => { }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, icon: Icon }: any) {
    return (
        <div className="flex min-w-44 items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{value.toLocaleString()}</p>
            </div>
        </div>
    );
}
