import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Plus, Search as SearchIcon, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Usuarios', href: route('usuarios.index') },
];

export default function Index({ filters: initialFilters, roles, cuentas, estados, default_user_price }: any) {
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        sort_field: initialFilters?.sort_field || 'id',
        sort_order: initialFilters?.sort_order || 'desc',
        page: initialFilters?.page || 1,
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.usuarios.index'), { params });
                setItems(response.data.data);
                setMeta(response.data.meta);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        },
        [filters],
    );

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page, filters.sort_field, filters.sort_order]);

    const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
        null, // We handle data locally
        (params: any) => ({ url: route('api.usuarios.destroy', params.id) }),
    );

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const columns = [
        {
            name: 'ID',
            selector: (row: any) => row.id,
            sortable: true,
            sortField: 'id',
            width: '70px',
        },
        {
            name: 'Nombre',
            selector: (row: any) => row.name,
            sortable: true,
            sortField: 'name',
        },
        {
            name: 'Usuario',
            selector: (row: any) => row.username,
            sortable: true,
            sortField: 'username',
        },
        {
            name: 'Email',
            selector: (row: any) => row.email,
            sortable: true,
            sortField: 'email',
        },
        {
            name: 'Rol',
            cell: (row: any) => (
                <Badge variant="outline" className="capitalize">
                    {row.role || 'Sin rol'}
                </Badge>
            ),
            sortable: true,
            sortField: 'role',
        },
        {
            name: 'Cuenta',
            selector: (row: any) => row.cuenta?.nombre || 'N/A',
            sortable: true,
            sortField: 'cuenta_id',
        },
        {
            name: 'Ciudad',
            selector: (row: any) => (row.ciudad?.name ? `${row.ciudad.name} (${row.ciudad.state?.country?.name || ''})` : 'N/A'),
        },
        {
            name: 'Precio Suscripción',
            selector: (row: any) => `$${Number(row.precio_suscripcion || 0).toLocaleString()}`,
            sortable: true,
            sortField: 'precio_suscripcion',
        },
        {
            name: 'Fecha de Vencimiento',
            selector: (row: any) => row.fecha_vencimiento,
            sortable: true,
            sortField: 'fecha_vencimiento',
        },
        {
            name: 'Estado',
            cell: (row: any) => <Badge variant={row.estado ? 'default' : 'destructive'}>{row.estado ? 'Activo' : 'Inactivo'}</Badge>,
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
            title: 'Editar',
            icon: Edit,
            action: (id: number) => onSetItem(id),
        },
        {
            title: 'Eliminar',
            icon: Trash,
            action: (id: number) => onTrash(id).then(() => fetchData()),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />

            <div className="space-y-6 p-4">
                <PageHeader title="Usuarios" description="Gestión de usuarios del sistema." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por nombre, usuario, email..."
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
                    <Button onClick={() => onToggleModal(true)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Nuevo Usuario
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        actions={actions}
                        processing={loading}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => setFilters((prev) => ({ ...prev, page }))}
                        setPageSize={(per_page) => setFilters((prev) => ({ ...prev, per_page, page: 1 }))}
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

            <Modal show={show} closeable={true} title="Gestionar Usuario">
                <Form
                    id={id}
                    processing={processing}
                    onClose={() => onToggleModal(false)}
                    onStore={(storeFn: any, updateFn: any, data: any) =>
                        onStore(storeFn, updateFn, data, false).then(() => {
                            onToggleModal(false);
                            fetchData();
                        })
                    }
                    onGetItem={() => onGetItem(() => ({ url: route('api.usuarios.show', { usuario: id }) }), {})}
                    onReload={fetchData}
                    roles={roles}
                    cuentas={cuentas}
                    estados={estados}
                    default_user_price={default_user_price}
                />
            </Modal>
        </AppLayout>
    );
}
