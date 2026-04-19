import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { DollarSign, Search as SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Cartera', href: route('cartera.index') },
];

export default function Index({ filters: initialFilters }: any) {
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({
        total: 0,
        current_page: 1,
        per_page: 25,
        stats: { total_clientes: 0, con_saldo_pendiente: 0, saldo_total: 0 },
    });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
        tab: initialFilters?.tab || 'todo',
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.cartera.index'), { params });
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

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page, filters.tab]);

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const columns = [
        {
            name: 'Nombre',
            cell: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${row.saldo > 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
                    <span className="text-sm font-medium tracking-tight text-slate-900 uppercase">{row.nombre}</span>
                </div>
            ),
            sortable: true,
            sortField: 'name',
        },
        {
            name: 'Saldo',
            cell: (row: any) => (
                <span
                    className={`text-sm font-medium ${row.saldo > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}
                >
                    ${row.saldo.toLocaleString()}
                </span>
            ),
            sortable: true,
            sortField: 'saldo',
        },
        {
            name: 'Ciudad',
            cell: (row: any) => (
                <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium tracking-tighter text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                    {row.ciudad}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cartera" />

            <div className="space-y-6 p-4">
                <PageHeader
                    title="Cartera / Accounts"
                    description={`${meta.stats.total_clientes} clientes · ${meta.stats.con_saldo_pendiente} con saldo pendiente`}
                />

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div className="flex max-w-md flex-1 items-center gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-9"
                                defaultValue={filters.search}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
                                onBlur={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-700">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="mb-1 text-[10px] leading-none font-medium text-slate-400 uppercase dark:text-slate-500">
                                Saldo Total
                            </span>
                            <span className="text-lg leading-none font-medium tracking-tighter text-slate-900 dark:text-white">
                                ${meta.stats.saldo_total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        loading={loading}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => setFilters((prev) => ({ ...prev, page }))}
                        setPageSize={(size) => setFilters((prev) => ({ ...prev, per_page: size, page: 1 }))}
                        onSort={(column: any, sortOrder) => {
                            setFilters((prev) => ({ ...prev, sort_field: column.sortField, sort_order: sortOrder, page: 1 }));
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
