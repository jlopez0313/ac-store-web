import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, Box, TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Cardex', href: route('cardex.index') },
];

export default function Index({ lista, stats, filters }: any) {
    const {
        data,
        meta: { total, current_page, per_page },
    } = lista;

    const { onReload, processing } = useCrudPage(lista, null);

    const currentTab = filters.tab || 'todo';

    const handleTabChange = (tab: string) => {
        router.visit(route('cardex.index', {
            ...filters,
            tab: tab,
            page: 1,
        }), { preserveState: true });
    };

    const tabs = [
        'Todo',
        'Más Tiempo en Bodega',
        'Menos Tiempo en Bodega',
        'Más Cantidad en Bodega',
        'Menos Cantidad en Bodega',
        'Agotado'
    ];

    const columns = [
        {
            name: 'Referencia',
            cell: (row: any) => (
                <span className="font-mono font-black text-xs text-indigo-600 tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {row.referencia}
                </span>
            ),
            sortable: true,
            width: '120px',
        },
        {
            name: 'Descripción',
            cell: (row: any) => (
                <span className="font-medium text-slate-700 uppercase text-[11px] leading-tight line-clamp-2">
                    {row.descripcion}
                </span>
            ),
            grow: 1.5,
        },
        {
            name: 'Entradas',
            cell: (row: any) => (
                <span className="font-black text-slate-900 text-sm">
                    {row.entradas.toLocaleString()}
                </span>
            ),
            center: true,
        },
        {
            name: 'Ventas',
            cell: (row: any) => (
                <span className="font-black text-slate-400 text-xs">
                    {row.ventas.toLocaleString()}
                </span>
            ),
            center: true,
        },
        {
            name: 'Bodega',
            cell: (row: any) => (
                <Badge className={`font-black text-xs tracking-tighter px-2 w-14 flex justify-center ${row.bodega > 0 ? 'bg-indigo-600 text-white' : 'bg-red-50 text-red-500 border-red-200'}`} variant={row.bodega > 0 ? 'default' : 'outline'}>
                    {row.bodega.toLocaleString()}
                </Badge>
            ),
            center: true,
        },
        {
            name: 'Días',
            cell: (row: any) => (
                <div className={`font-mono font-black text-[10px] rounded-full h-8 w-8 flex items-center justify-center border-2 ${row.dias > 30 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {row.dias}
                </div>
            ),
            center: true,
        },
        {
            name: 'P/Costo',
            cell: (row: any) => (
                <span className="font-medium text-slate-400 text-[11px]">
                    ${row.p_costo.toLocaleString()}
                </span>
            ),
            right: true,
        },
        {
            name: 'P/Venta',
            cell: (row: any) => (
                <span className="font-black text-slate-900 text-sm">
                    ${row.p_venta.toLocaleString()}
                </span>
            ),
            right: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cardex / Stock Tracker" />

            <div className="p-4 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <PageHeader
                        title="Cardex / Stock Tracker"
                        description={`${stats.total_referencias} referencias · ${stats.total_bodega} unid. en bodega`}
                    />

                    <div className="flex flex-wrap items-center gap-4">
                        <StatCard
                            label="Total Entradas"
                            value={stats.total_entradas}
                            icon={TrendingUp}
                            color="indigo"
                        />
                        <StatCard
                            label="Total Ventas"
                            value={stats.total_ventas}
                            icon={ArrowUpRight}
                            color="amber"
                        />
                        <StatCard
                            label="Total Bodega"
                            value={stats.total_bodega}
                            icon={Box}
                            color="emerald"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex-1 max-w-sm">
                        <Search filters={filters} ruta="cardex" />
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTabChange(t)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab.toLowerCase() === t.toLowerCase() ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t === 'Todo' ? 'Ver Todo' : t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
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
                        onSort={() => {}}
                        setPageSize={(size) => onReload(null, size)}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        indigo: 'bg-indigo-600 text-indigo-100 shadow-indigo-100',
        amber: 'bg-amber-500 text-amber-100 shadow-amber-100',
        emerald: 'bg-emerald-500 text-emerald-100 shadow-emerald-100',
    };

    return (
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs transition-all hover:shadow-md min-w-44">
            <div className={`h-11 w-11 flex items-center justify-center rounded-xl text-white shadow-lg ${colors[color].split(' ')[0]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-xl font-black text-slate-900 leading-none tracking-tighter">
                    {value.toLocaleString()}
                </p>
            </div>
        </div>
    );
}
