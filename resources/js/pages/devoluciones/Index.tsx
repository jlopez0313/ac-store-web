import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Filter, User as UserIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Devoluciones', href: route('devoluciones.index') },
];

export default function Index({ devoluciones, locals, filters }: any) {
    const {
        data: items,
        meta: { total, current_page, per_page },
    } = devoluciones;

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        router.visit(route('devoluciones.index', newFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const clearFilters = () => {
        router.visit(route('devoluciones.index'), {
            preserveState: true,
            preserveScroll: true
        });
    };

    const columns = [
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha_devolucion,
            sortable: true,
            width: '180px',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                        {new Date(row.fecha_devolucion).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {new Date(row.fecha_devolucion).toLocaleTimeString()}
                    </span>
                </div>
            ),
        },
        {
            name: 'Factura de Venta',
            selector: (row: any) => row.venta_id,
            width: '160px',
            cell: (row: any) => (
                <Link
                    href={route('ventas.index', { search: row.venta_id })}
                    className="group flex items-center"
                >
                    <Badge variant="secondary" className="font-bold cursor-pointer hover:bg-slate-200 transition-colors">
                        #{row.venta_id}
                    </Badge>
                </Link>
            ),
        },
        {
            name: 'Local',
            selector: (row: any) => row.venta?.local?.name,
            sortable: true,
            cell: (row: any) => <span className="text-sm text-slate-700 font-medium">{row.venta?.local?.name || 'N/A'}</span>,
        },
        {
            name: 'Producto',
            grow: 1.5,
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <span className="font-bold text-primary">{row.producto?.codigo}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{row.producto?.descripcion}</span>
                </div>
            ),
        },
        {
            name: 'Ubicación',
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <span className="text-sm font-semibold text-slate-900">{row.bodega?.nombre}</span>
                    <span className="text-[11px] text-slate-400 uppercase font-bold">{row.estanteria?.nombre}</span>
                </div>
            ),
        },
        {
            name: 'Detalle',
            width: '100px',
            cell: (row: any) => (
                <div className="flex flex-col items-center">
                    <Badge variant="outline" className="text-[11px] mb-1 bg-white">Talla {row.talla}</Badge>
                    <span className="text-xs font-bold text-slate-600">{row.cantidad} ud</span>
                </div>
            ),
        },
        {
            name: 'Monto',
            width: '150px',
            cell: (row: any) => <span className="font-medium text-slate-900">${Number(row.subtotal).toLocaleString()}</span>,
        },
        {
            name: 'Usuario',
            width: '150px',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <UserIcon className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-600 truncate">{row.creator?.name || 'Sistema'}</span>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial de Devoluciones" />

            <div className="p-4 space-y-6">
                <PageHeader
                    title="Historial de Devoluciones"
                    description="Registro detallado de productos eliminados de ventas y reintegrados al inventario."
                />

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[240px]">
                            <SelectField
                                title="Filtrar por Local"
                                name="local_id"
                                item={{ idx: 'id', value: 'name' }}
                                lista={locals}
                                value={filters.local_id || ''}
                                onChange={(val) => handleFilter('local_id', val || null)}
                                error={undefined}
                                placeholder="Todos los locales"
                            />
                        </div>

                        <div className="w-44">
                            <InputField
                                title="Desde"
                                name="from"
                                type="date"
                                value={filters.from || ''}
                                onChange={(val) => handleFilter('from', val)}
                                error={undefined}
                            />
                        </div>

                        <div className="w-44">
                            <InputField
                                title="Hasta"
                                name="to"
                                type="date"
                                value={filters.to || ''}
                                onChange={(val) => handleFilter('to', val)}
                                error={undefined}
                            />
                        </div>

                        <div className="pb-1">
                            {(filters.local_id || filters.from || filters.to) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-9 text-slate-500 hover:text-red-600"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Limpiar
                                </Button>
                            )}
                        </div>

                        <div className="ml-auto pb-2">
                            <Badge variant="secondary" className="px-3 py-1 font-semibold text-slate-600">
                                {total} Registros encontrados
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={total}
                        currentPage={current_page}
                        paginationPerPage={per_page}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => router.visit(route('devoluciones.index', { page }), { preserveState: true, preserveScroll: true })}
                        setPageSize={() => { }}
                        onSort={() => { }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
