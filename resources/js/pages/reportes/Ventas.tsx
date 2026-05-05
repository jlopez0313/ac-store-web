import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BarChart3, Package, Search, ShoppingCart, X } from 'lucide-react';
import { useCallback, useState } from 'react';

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
        desde: firstDay,
        hasta: today,
        local_id: '',
        cuenta_id: 'all',
    });

    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25, total_ventas: 0, total_productos: 0 });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchData = useCallback(async (params: any = {}) => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.reportes.ventas'), {
                params: { ...filters, ...params },
            });
            setData(response.data.data);
            setMeta(response.data.meta);
            setSearched(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleSearch = () => fetchData({ page: 1 });

    const handleClear = () => {
        setFilters({ desde: firstDay, hasta: today, local_id: '', cuenta_id: 'all' });
        setData([]);
        setMeta({ total: 0, current_page: 1, per_page: 25, total_ventas: 0, total_productos: 0 });
        setSearched(false);
    };

    const columns = [
        {
            name: 'ID',
            selector: (row: any) => row.id,
            width: '80px',
            sortable: true,
        },
        {
            name: 'Código',
            selector: (row: any) => row.numero || '-',
            width: '100px',
        },
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha || '-',
            sortable: true,
            width: '120px',
        },
        ...(isSuper ? [{
            name: 'Cuenta',
            selector: (row: any) => row.cuenta?.nombre || 'N/A',
        }] : []),
        {
            name: 'Local',
            selector: (row: any) => row.local?.name || 'N/A',
            grow: 1,
        },
        {
            name: 'Vendedor',
            selector: (row: any) => row.vendedor?.nombre || row.local?.name || 'N/A',
            grow: 1,
        },
        {
            name: 'Estado',
            width: '110px',
            cell: (row: any) => (
                <Badge variant={row.estado === 'cerrada' ? 'default' : 'outline'} className="capitalize">
                    {row.estado}
                </Badge>
            ),
        },
        {
            name: 'Total',
            selector: (row: any) => row.total,
            sortable: true,
            width: '130px',
            cell: (row: any) => (
                <span className="font-bold text-green-600">${Number(row.total || 0).toLocaleString()}</span>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporte de Ventas" />

            <div className="space-y-6 p-4">
                <PageHeader
                    title="Reporte de Ventas"
                    description="Analiza las ventas en un rango de fechas con filtros detallados."
                />

                {/* Filters */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-12">
                        {isSuper && (
                            <div className="lg:col-span-2">
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

                        <div className="lg:col-span-2">
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

                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="desde">Desde</Label>
                            <Input
                                id="desde"
                                type="date"
                                value={filters.desde}
                                onChange={(e) => setFilters(p => ({ ...p, desde: e.target.value }))}
                                className="h-10 bg-white dark:bg-slate-800"
                            />
                        </div>

                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="hasta">Hasta</Label>
                            <Input
                                id="hasta"
                                type="date"
                                value={filters.hasta}
                                onChange={(e) => setFilters(p => ({ ...p, hasta: e.target.value }))}
                                className="h-10 bg-white dark:bg-slate-800"
                            />
                        </div>

                        <div className="flex gap-2 lg:col-span-2">
                            <Button onClick={handleSearch} disabled={loading} className="h-10 flex-1">
                                <Search className="mr-2 h-4 w-4" />
                                {loading ? 'Cargando...' : 'Generar'}
                            </Button>
                            <Button variant="outline" onClick={handleClear} size="icon" className="h-10 w-10 shrink-0" title="Limpiar">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                {searched && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium uppercase text-slate-400">Facturas</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{meta.total.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium uppercase text-slate-400">Productos Vendidos</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(meta.total_productos).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium uppercase text-slate-400">Total Vendido</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">${Number(meta.total_ventas).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {searched && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
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
                            onSort={() => {}}
                        />
                    </div>
                )}

                {!searched && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-700 dark:bg-slate-800/50">
                        <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                        <p className="text-sm text-slate-400">Selecciona los filtros y presiona <strong>Generar</strong> para ver el reporte.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
