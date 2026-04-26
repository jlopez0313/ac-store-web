import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
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
    { title: 'Marcas', href: route('marcas.index') },
];

export default function Index({ filters: initialFilters }: any) {
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
        sort_field: initialFilters?.sort_field || 'nombre',
        sort_order: initialFilters?.sort_order || 'asc',
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.marcas.index'), { params });
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
    }, [filters.page, filters.per_page, filters.sort_field, filters.sort_order]);

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const handleDelete = async (id: number) => {
        const result = await confirmDialog({
            title: '¿Eliminar marca?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(route('api.marcas.destroy', { marca: id }));
                showAlert('success', 'Marca eliminada correctamente');
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
            sortField: 'id',
            width: '80px',
        },
        {
            name: 'Nombre',
            selector: (row: any) => row.nombre,
            sortable: true,
            sortField: 'nombre',
        },
        {
            name: 'Cantidad de Referencias',
            selector: (row: any) => row.referencias_count || 0,
            sortable: true,
            sortField: 'referencias_count',
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
            <Head title="Marcas" />

            <div className="p-4 space-y-6">
                <PageHeader title="Marcas" description="Gestión de marcas para categorizar referencias de productos." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-md gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por nombre..."
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
                    <Button
                        className="ms-4"
                        onClick={() => {
                            setSelectedId(null);
                            setShow(true);
                        }}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Nueva Marca
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

            <Modal show={show} onClose={() => setShow(false)} closeable={true} title="Gestionar Marca">
                <Form
                    id={selectedId}
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
