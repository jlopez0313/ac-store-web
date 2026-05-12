import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Plus, Search as SearchIcon, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Muestras', href: route('muestras.index') },
];

export default function Index({ filters: initialFilters, cuentas, locals }: any) {
    const { isSuperAdmin } = useAuth();

    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

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
                const response = await axios.get(route('api.muestras.index'), { params });
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

    const handleDelete = async (id: number) => {
        const result = await confirmDialog({
            title: '¿Eliminar registro?',
            text: 'Se devolverá el stock al inventario.',
            icon: 'warning',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(route('api.muestras_crud.destroy', { muestras_crud: id }));
                showAlert('success', 'Registro eliminado correctamente');
                fetchData();
            } catch (error: any) {
                showAlert('error', error.response?.data?.error || 'Error al eliminar');
            }
        }
    };

    const columns = [
        {
            name: 'ID',
            selector: (row: any) => row.id,
            sortable: true,
            width: '80px',
        },
        {
            name: 'Fecha',
            selector: (row: any) => row.fecha,
            sortable: true,
        },
        {
            name: 'Local',
            selector: (row: any) => row.local?.name,
            sortable: true,
        },
        {
            name: 'Referencia',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.referencia?.codigo}</span>
                    <span className="line-clamp-1 text-[10px] text-slate-500">{row.referencia?.descripcion}</span>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Talla',
            selector: (row: any) => row.talla,
            width: '80px',
        },
        {
            name: 'Ubicación Original',
            cell: (row: any) => (
                <div className="text-[10px] leading-tight text-slate-600 dark:text-slate-400">
                    <div>{row.bodega_original}</div>
                    <div className="text-slate-400 dark:text-slate-500">Estante: {row.estante_original}</div>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Etiquetas',
            cell: (row: any) => (
                <div className="flex flex-wrap gap-1">
                    {row.etiquetas?.map((tag: string) => (
                        <Badge
                            key={tag}
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-[10px] dark:border-slate-700 dark:bg-slate-800"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            name: 'Estado',
            cell: (row: any) => (
                <Badge
                    variant={row.estado === 'activo' ? 'outline' : 'default'}
                    className={`text-[10px] font-bold uppercase ${
                        row.estado === 'activo'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : row.estado === 'vendido'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                    {row.estado}
                </Badge>
            ),
            sortable: true,
            width: '100px',
        },
        ...(isSuperAdmin
            ? [
                  {
                      name: 'Cuenta',
                      selector: (row: any) => row.cuenta?.nombre,
                  },
              ]
            : []),
        {
            name: 'Impreso',
            cell: (row: any) => (
                <Badge variant={row.impreso ? 'default' : 'secondary'}>
                    {row.impreso ? 'Sí' : 'No'}
                </Badge>
            ),
            sortable: true,
            width: '100px',
        },
        {
            name: 'Registrado por',
            selector: (row: any) => row.creado_por,
        },
    ];

    const actions = [
        {
            title: 'Editar',
            icon: Edit,
            action: (id: number) => {
                setSelectedId(id);
                setShow(true);
            },
        },
        {
            title: 'Eliminar',
            icon: Trash,
            action: (id: number) => handleDelete(id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Muestras" />
            <div className="p-4 space-y-6">
                <PageHeader title="Distribución de Muestras" description="Historial de muestras enviadas a locales." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-md gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por referencia..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setSelectedId(null);
                            setShow(true);
                        }}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Registrar Muestra
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        processing={loading}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        actions={actions}
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

            <Modal show={show} onClose={() => setShow(false)} closeable={true} title={selectedId ? 'Editar Muestra' : 'Registrar Distribución de Muestra'}>
                <Form
                    id={selectedId}
                    cuentas={cuentas}
                    locals={locals}
                    processing={loading}
                    onClose={() => setShow(false)}
                    onStore={async (storeFn: any, updateFn: any, data: any) => {
                        try {
                            if (selectedId) {
                                await axios.put(updateFn({ id: selectedId }).url, data);
                            } else {
                                await axios.post(storeFn().url, data);
                            }
                            setShow(false);
                            fetchData();
                            showAlert('success', 'Operación exitosa');
                        } catch (error: any) {
                            showAlert('error', error.response?.data?.error || 'Error al procesar');
                        }
                    }}
                    onGetItem={async (showFn: any) => {
                        const res = await axios.get(showFn({ id: selectedId }).url);
                        return res.data.data;
                    }}
                    onReload={() => fetchData()}
                />
            </Modal>
        </AppLayout>
    );
}
