import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { DollarSign } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Cartera', href: route('cartera.index') },
];

export default function Index({ lista, stats, filters }: any) {
    const {
        data,
        meta: { total, current_page, per_page },
    } = lista;

    const { onReload, processing } = useCrudPage(lista, null);

    const currentTab = filters.tab || 'todo';

    const handleTabChange = (tab: string) => {
        router.visit(route('cartera.index', {
            ...filters,
            tab: tab,
        }), { preserveState: true });
    };

    const columns = [
        {
            name: 'Nombre',
            cell: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${row.saldo > 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
                    <span className="font-medium text-slate-900 uppercase text-sm tracking-tight">{row.nombre}</span>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Saldo',
            cell: (row: any) => (
                <span className={`font-medium text-sm ${row.saldo > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                    ${row.saldo.toLocaleString()}
                </span>
            ),
            sortable: true,
        },
        {
            name: 'Ciudad',
            cell: (row: any) => (
                <Badge variant="outline" className="font-medium text-[10px] tracking-tighter px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-600">
                    {row.ciudad}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cartera" />

            <div className="p-4 space-y-6">
                <PageHeader
                    title="Cartera / Accounts"
                    description={`${stats.total_clientes} clientes · ${stats.con_saldo_pendiente} con saldo pendiente`}
                />
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between px-4 pt-4 gap-4">
                <div className="flex items-end gap-4 flex-1">
                    <Search filters={filters} ruta="cartera" />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                    <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-slate-400 uppercase leading-none mb-1">Saldo Total</span>
                        <span className="text-lg font-medium text-slate-900 tracking-tighter leading-none">
                            ${stats.saldo_total.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    <DataGrid
                        data={data}
                        columns={columns}
                        total={total}
                        currentPage={current_page}
                        paginationPerPage={per_page}
                        processing={processing}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => onReload(page)}
                        onSort={(column, direction) => {
                            const params = new URLSearchParams(window.location.search);
                            params.set('sort', column.name?.toString().toLowerCase() || '');
                            params.set('order', direction);
                            router.visit(`${window.location.pathname}?${params.toString()}`, { preserveScroll: true });
                        }}
                        setPageSize={(size) => onReload(null, size)}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
