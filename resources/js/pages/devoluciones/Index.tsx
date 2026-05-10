import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { ViewerModal } from '@/components/ui/ViewerModal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Image as ImageIcon, Search as SearchIcon, User as UserIcon, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Devoluciones', href: route('devoluciones.index') },
];

export default function Index({ locals, filters: initialFilters }: any) {
    const { auth }: any = usePage().props;
    const isSuperAdmin = auth.user.role === 'superadmin';
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        local_id: initialFilters?.local_id || '',
        from: initialFilters?.from || '',
        to: initialFilters?.to || '',
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.devoluciones.index'), { params });
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
    }, [filters.page, filters.per_page, filters.local_id, filters.from, filters.to]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const clearFilters = () => {
        setFilters({
            local_id: '',
            from: '',
            to: '',
            search: '',
            per_page: 25,
            page: 1,
        });
    };

    const columns = [
        {
            name: 'Foto',
            width: '70px',
            cell: (row: any) => (
                <div
                    className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 transition-transform hover:scale-110"
                    onClick={() => setViewerImage(row.producto?.foto)}
                >
                    {row.producto?.foto ? (
                        <img src={`/storage/${row.producto.foto}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                    )}
                </div>
            ),
        },
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha_devolucion,
            sortable: true,
            width: '100px',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(row.fecha_devolucion).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(row.fecha_devolucion).toLocaleTimeString()}</span>
                </div>
            ),
        },
        {
            name: 'Factura de Venta',
            selector: (row: any) => row.venta?.numero || row.venta_id,
            width: '160px',
            cell: (row: any) => (
                <Link href={route('ventas.index', { search: row.venta?.numero || row.venta_id })} className="group flex items-center">
                    <Badge variant="secondary" className="cursor-pointer font-bold transition-colors hover:bg-slate-200">
                        #{row.venta?.numero || row.venta_id}
                    </Badge>
                </Link>
            ),
        },
        {
            name: 'Local',
            selector: (row: any) => row.venta?.local?.name,
            sortable: true,
            cell: (row: any) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.venta?.local?.name || 'N/A'}</span>,
        },
        ...(isSuperAdmin ? [{
            name: 'Cuenta',
            selector: (row: any) => row.venta?.cuenta?.nombre,
            sortable: true,
            width: '150px',
            cell: (row: any) => (
                <Badge variant="outline" className="font-bold border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                    {row.venta?.cuenta?.nombre || 'N/A'}
                </Badge>
            ),
        }] : []),
        {
            name: 'Producto',
            grow: 1.5,
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <span className="text-primary font-bold">{row.producto?.codigo}</span>
                    <span className="max-w-[200px] truncate text-xs text-slate-500">{row.producto?.descripcion}</span>
                </div>
            ),
        },
        {
            name: 'Ubicación',
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.bodega?.nombre}</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase dark:text-slate-500">{row.estanteria?.nombre}</span>
                </div>
            ),
        },
        {
            name: 'Detalle',
            width: '100px',
            cell: (row: any) => (
                <div className="flex flex-col items-center">
                    <Badge variant="outline" className="mb-1 bg-white text-[11px] dark:bg-slate-800">
                        Talla {row.talla}
                    </Badge>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{row.cantidad} ud</span>
                </div>
            ),
        },
        {
            name: 'Monto',
            width: '120px',
            cell: (row: any) => <span className="font-medium text-slate-900 dark:text-slate-100">${Number(row.subtotal).toLocaleString()}</span>,
        },
        {
            name: 'Observación',
            grow: 1,
            cell: (row: any) => <span className="text-xs leading-tight text-slate-500 italic">{row.observacion || 'Sin observación'}</span>,
        },
        {
            name: 'Usuario',
            width: '150px',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <UserIcon className="h-3 w-3 text-slate-400" />
                    <span className="truncate text-xs text-slate-600 dark:text-slate-400">{row.eliminador?.name || 'Sistema'}</span>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial de Devoluciones" />

            <div className="space-y-6 p-4">
                <PageHeader
                    title="Historial de Devoluciones"
                    description="Registro detallado de productos eliminados de ventas y reintegrados al inventario."
                />

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[300px] flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    id="search-input"
                                    placeholder="Buscar por código, observación..."
                                    className="pl-9"
                                    defaultValue={filters.search}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const val = (document.getElementById('search-input') as HTMLInputElement)?.value;
                                    handleSearch(val);
                                }}
                            >
                                <SearchIcon className="h-4 w-4 mr-2" />
                                Buscar
                            </Button>
                        </div>

                        <div className="min-w-[200px]">
                            <SelectField
                                title="Filtrar por Local"
                                name="local_id"
                                item={{ idx: 'id', value: 'name' }}
                                lista={locals}
                                value={filters.local_id || ''}
                                onChange={(val) => handleFilterChange('local_id', val || null)}
                                error={undefined}
                                placeholder="Todos los locales"
                            />
                        </div>

                        <div className="w-40">
                            <InputField
                                title="Desde"
                                name="from"
                                type="date"
                                value={filters.from || ''}
                                onChange={(val) => handleFilterChange('from', val)}
                                error={undefined}
                            />
                        </div>

                        <div className="w-40">
                            <InputField
                                title="Hasta"
                                name="to"
                                type="date"
                                value={filters.to || ''}
                                onChange={(val) => handleFilterChange('to', val)}
                                error={undefined}
                            />
                        </div>

                        <div className="pb-1">
                            {(filters.local_id || filters.from || filters.to || filters.search) && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-slate-500 hover:text-red-600">
                                    <X className="mr-2 h-4 w-4" />
                                    Limpiar
                                </Button>
                            )}
                        </div>

                        <div className="ml-auto pb-2">
                            <Badge variant="secondary" className="px-3 py-1 font-semibold text-slate-600">
                                {meta.total} Registros encontrados
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
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

            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={() => setViewerImage(null)}
            />
        </AppLayout>
    );
}
