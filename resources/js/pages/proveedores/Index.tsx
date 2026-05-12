import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
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
    { title: 'Proveedores', href: route('proveedores.index') },
];

export default function Index({ filters: initialFilters, cuentas, tipos_documento }: any) {
    const { isSuperAdmin } = useAuth();

    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        sort_field: initialFilters?.sort_field || 'nombre',
        sort_order: initialFilters?.sort_order || 'asc',
        page: initialFilters?.page || 1,
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.proveedores.index'), { params });
                setItems(response.data.data);
                setMeta(response.data.meta);
            } catch (error) {
                console.error('Error fetching providers:', error);
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

    const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(null, (params: any) => ({
        url: route('api.proveedores.destroy', { proveedore: params.id }),
    }));

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
    };

    const columns = [
        {
            name: 'Nombre / Razón Social',
            selector: (row: any) => row.nombre,
            sortable: true,
            sortField: 'nombre',
            width: '250px',
        },
        {
            name: 'Documento',
            selector: (row: any) => `${row.tipo_documento} ${row.documento}`,
            sortable: true,
            sortField: 'documento',
        },
        {
            name: 'Teléfono',
            selector: (row: any) => row.telefono || 'N/A',
        },
        {
            name: 'Correo',
            selector: (row: any) => row.correo || 'N/A',
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
            selector: (row: any) => (
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${row.estado
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800'
                        }`}
                >
                    {row.estado ? 'Activo' : 'Inactivo'}
                </span>
            ),
            sortable: true,
            sortField: 'estado',
            width: '100px',
        },
        {
            name: 'Registrado',
            selector: (row: any) => row.created_at,
            sortable: true,
            sortField: 'created_at',
            width: '180px',
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
            <Head title="Proveedores" />
            <div className="p-4 space-y-6">
                <PageHeader title="Proveedores" description="Gestión del catálogo de proveedores para compras y abastecimiento." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por nombre, NIT..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={() => onToggleModal(true)}>
                            <Plus className="mr-2 h-5 w-5" />
                            Nuevo Proveedor
                        </Button>
                    </div>
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

            <Modal show={show} onClose={() => onToggleModal(false)} closeable={true} title="Gestionar Proveedor">
                <Form
                    id={id}
                    cuentas={cuentas}
                    tiposDocs={tipos_documento}
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
                />
            </Modal>
        </AppLayout>
    );
}
