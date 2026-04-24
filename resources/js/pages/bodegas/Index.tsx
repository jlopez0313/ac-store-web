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
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Edit, LayoutGrid, Plus, Search as SearchIcon, ShieldCheck, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ManagementModal } from '../estanterias/ManagementModal';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Bodegas', href: route('bodegas.index') },
];

export default function Index({ filters: initialFilters, estados, cuentas }: any) {
    const { isSuperAdmin, role } = useAuth();
    const [showShelvesModal, setShowShelvesModal] = useState(false);
    const [selectedBodegaForShelves, setSelectedBodegaForShelves] = useState<any>(null);

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
                const response = await axios.get(route('api.bodegas.index'), { params });
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
            title: '¿Eliminar bodega?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(route('api.bodegas.destroy', { bodega: id }));
                showAlert('success', 'Bodega eliminada correctamente');
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
            name: 'Dirección',
            selector: (row: any) => row.direccion || 'Sin dirección',
            sortable: true,
            sortField: 'direccion',
        },
        ...(isSuperAdmin
            ? [
                  {
                      name: 'Cuenta / Empresa',
                      selector: (row: any) => row.cuenta?.nombre || 'N/A',
                      sortable: true,
                      sortField: 'cuenta_id',
                  },
              ]
            : []),
        {
            name: 'Estado',
            cell: (row: any) => <Badge variant={row.estado ? 'default' : 'destructive'}>{row.estado ? 'Activa' : 'Inactiva'}</Badge>,
            sortable: true,
            sortField: 'estado',
        },
        {
            name: 'Creado',
            selector: (row: any) => row.created_at,
            sortable: true,
            sortField: 'created_at',
        },
    ];

    const actions = [
        {
            title: 'Gestionar Estanterías',
            icon: LayoutGrid,
            action: (id: number) => {
                const bodega = items.find((b: any) => b.id === id);
                setSelectedBodegaForShelves(bodega);
                setShowShelvesModal(true);
            },
        },
        {
            title: 'Locales con acceso',
            icon: ShieldCheck,
            hide: !isSuperAdmin && role !== 'admin',
            action: (id: number) => router.visit(route('bodegas.accesos', { bodega: id })),
        },
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
            <Head title="Bodegas" />

            <div className="p-4 space-y-6">
                <PageHeader title="Bodegas" description="Gestión de almacenes y bodegas del sistema." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-md gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por nombre, código..."
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
                        Nueva Bodega
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

            <Modal show={show} onClose={() => setShow(false)} closeable={true} title="Gestionar Bodega">
                <Form
                    id={selectedId}
                    estados={estados}
                    cuentas={cuentas}
                    processing={loading}
                    setIsOpen={setShow}
                    onStore={async (data: any) => {
                        try {
                            if (selectedId) {
                                await axios.put(route('api.bodegas.update', { bodega: selectedId }), data);
                            } else {
                                await axios.post(route('api.bodegas.store'), data);
                            }
                            setShow(false);
                            fetchData();
                            showAlert('success', 'Operación exitosa');
                        } catch (error: any) {
                            showAlert('error', error.response?.data?.error || 'Error al procesar');
                        }
                    }}
                    onGetItem={async (id: number) => {
                        const res = await axios.get(route('api.bodegas.show', { bodega: id }));
                        return res.data.data;
                    }}
                    onReload={() => fetchData()}
                />
            </Modal>

            {selectedBodegaForShelves && (
                <ManagementModal
                    isOpen={showShelvesModal}
                    onClose={() => {
                        setShowShelvesModal(false);
                        setSelectedBodegaForShelves(null);
                    }}
                    bodega={selectedBodegaForShelves}
                />
            )}
        </AppLayout>
    );
}
