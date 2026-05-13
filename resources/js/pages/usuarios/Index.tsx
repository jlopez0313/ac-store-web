import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard, Edit, Plus, Receipt, Search as SearchIcon, ShieldCheck, Trash, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Form } from './Form';
import RegisterPaymentModal from './RegisterPaymentModal';
import SubscriptionDetailModal from './SubscriptionDetailModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Usuarios', href: route('usuarios.index') },
];

export default function Index({ filters: initialFilters, roles, cuentas, estados, default_user_price }: any) {
    const { auth } = usePage<SharedData>().props;
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

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

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
    }, [filters.page, filters.per_page, filters.sort_field, filters.sort_order, filters.search]);

    const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
        null, // We handle data locally
        (params: any) => ({ url: route('api.usuarios.destroy', { usuario: params.id }) }),
    );

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
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
            name: 'Documento',
            selector: (row: any) => row.documento || 'N/A',
            sortable: true,
            sortField: 'documento',
        },
        {
            name: 'Usuario',
            selector: (row: any) => row.username,
            sortable: true,
            sortField: 'username',
            width: '200px',
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
            name: 'Accesos',
            cell: (row: any) => (
                <Badge variant="outline" className="font-bold border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {row.accesos_count || 0} Bodegas
                </Badge>
            ),
            sortable: true,
            sortField: 'accesos_count',
            width: '120px',
        },
        {
            name: 'Ciudad',
            selector: (row: any) => (row.ciudad?.name ? `${row.ciudad.name} (${row.ciudad.state?.country?.name || ''})` : 'N/A'),
        },
        {
            name: 'Precio Suscripción',
            selector: (row: any) => `$${Number(row.precio_suscripcion || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`,
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

    const moreActions = [
        {
            title: 'Permisos Bodegas',
            icon: ShieldCheck,
            hide: (row: any) => row.role !== 'local',
            action: (id: number) => router.visit(route('usuarios.accesos', { usuario: id })),
        },
        {
            title: 'Detalle Cobro',
            icon: CreditCard,
            hide: (row: any) => row.role !== 'local' || auth.user?.role !== 'superadmin',
            action: (id: number) => {
                const user = items.find(u => u.id === id);
                setSelectedUser(user);
                setIsSubscriptionModalOpen(true);
            },
        },
        {
            title: 'Registrar Pago',
            icon: Receipt,
            hide: (row: any) => row.role !== 'local',
            action: (id: number) => {
                const user = items.find(u => u.id === id);
                setSelectedUser(user);
                setIsPaymentModalOpen(true);
            },
        },
        {
            title: 'Gestionar Vendedores',
            icon: Users,
            hide: (row: any) => row.role !== 'local' || !row.maneja_vendedores,
            action: (id: number) => {
                router.visit(route('usuarios.vendedores', { usuario: id }));
            },
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

                <div className="flex flex-col justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por nombre, usuario, email..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                        </div>
                    </div>
                    <Button onClick={() => onToggleModal(true)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Nuevo Usuario
                    </Button>
                </div>

                <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        actions={actions}
                        moreActions={moreActions}
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

            <Modal show={show} onClose={() => onToggleModal(false)} closeable={true} title="Gestionar Usuario">
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
                    onGetItem={onGetItem}
                    onReload={fetchData}
                    roles={roles}
                    cuentas={cuentas}
                    estados={estados}
                    default_user_price={default_user_price}
                />
            </Modal>

            {selectedUser && (
                <>
                    <RegisterPaymentModal
                        user={selectedUser}
                        open={isPaymentModalOpen}
                        onOpenChange={setIsPaymentModalOpen}
                        onSuccess={fetchData}
                    />
                    <SubscriptionDetailModal
                        user={selectedUser}
                        open={isSubscriptionModalOpen}
                        onOpenChange={setIsSubscriptionModalOpen}
                        onSuccess={fetchData}
                    />
                </>
            )}
        </AppLayout>
    );
}
