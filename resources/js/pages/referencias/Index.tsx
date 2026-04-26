import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Image as ImageIcon, Plus, Search as SearchIcon, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Form } from './Form';
import { ViewerModal } from '@/components/ui/ViewerModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Referencias', href: route('referencias.index') },
];

export default function Index({ filters: initialFilters, cuentas, categorias, marcas }: any) {
    const { isSuperAdmin } = useAuth();

    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);

    const [selectedCuenta, setSelectedCuenta] = useState<string>('');
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        sort_field: initialFilters?.sort_field || 'codigo',
        sort_order: initialFilters?.sort_order || 'desc',
        page: initialFilters?.page || 1,
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params: any = { ...filters, ...newParams };
            if (selectedCuenta) params.cuenta_id = selectedCuenta;
            try {
                const response = await axios.get(route('api.referencias.index'), { params });
                setItems(response.data.data);
                setMeta(response.data.meta);
            } catch (error) {
                console.error('Error fetching references:', error);
            } finally {
                setLoading(false);
            }
        },
        [filters, selectedCuenta],
    );

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page, filters.sort_field, filters.sort_order, selectedCuenta]);

    const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
        null, // We handle data locally
        (params: any) => ({ url: route('api.referencias.destroy', { referencia: params.id }) }),
    );

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const columns = [
        {
            name: 'Foto',
            cell: (row: any) => (
                <button
                    type="button"
                    onClick={() => setViewerImage(row.foto)}
                    className="bg-muted border-border my-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded border transition-transform hover:scale-110 active:scale-95"
                >
                    {row.foto ? (
                        <img src={row.foto} alt={row.codigo} className="h-full w-full object-cover" />
                    ) : (
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                </button>
            ),
            width: '80px',
        },
        {
            name: 'Código',
            selector: (row: any) => row.codigo,
            sortable: true,
            sortField: 'codigo',
            width: '140px',
        },
        {
            name: 'Marca',
            selector: (row: any) => row.marca?.nombre || 'N/A',
            sortable: true,
            sortField: 'marca',
        },
        {
            name: 'Categoría',
            selector: (row: any) => row.categoria?.nombre || 'N/A',
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
            name: 'Descripción',
            selector: (row: any) => row.descripcion || 'Sin descripción',
            wrap: true,
            grow: 2,
        },
        {
            name: 'Creado',
            selector: (row: any) => row.created_at,
            sortable: true,
            sortField: 'created_at',
            width: '160px',
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
            <Head title="Referencias" />

            <div className="space-y-6 p-4">
                <PageHeader title="Referencias (Productos)" description="Gestión del catálogo maestro de productos y variaciones." />
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex flex-1 max-w-md gap-2">
                            <div className="relative flex-1">
                                <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    id="search-input"
                                    placeholder="Buscar por código, descripción, marca..."
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

                        <div className="flex flex-wrap items-center gap-2">
                            {isSuperAdmin && cuentas?.length > 0 && (
                                <div className="w-[220px]">
                                    <SelectField
                                        name="cuenta_id"
                                        title=""
                                        placeholder="Todas las cuentas"
                                        value={selectedCuenta}
                                        onChange={(val) => {
                                            setSelectedCuenta((val as string) || '');
                                            setFilters((prev) => ({ ...prev, page: 1 }));
                                        }}
                                        lista={cuentas}
                                        item={{ idx: 'id', value: 'nombre' }}
                                        error={undefined}
                                    />
                                </div>
                            )}
                            <Button onClick={() => onToggleModal(true)}>
                                <Plus className="mr-2 h-5 w-5" />
                                Nueva Referencia
                            </Button>
                        </div>
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

            <Modal show={show} onClose={() => onToggleModal(false)} closeable={true} title="Gestionar Referencia">
                <Form
                    id={id}
                    cuentas={cuentas}
                    categorias={categorias}
                    marcas={marcas}
                    processing={processing}
                    onClose={() => onToggleModal(false)}
                    onStore={(storeFn: any, updateFn: any, data: any) =>
                        onStore(storeFn, updateFn, data, true).then(() => {
                            onToggleModal(false);
                            fetchData();
                        })
                    }
                    onGetItem={(params: any) => onGetItem((p: any) => ({ url: route('api.referencias.show', { referencia: p.id }) }), params)}
                    onReload={fetchData}
                />
            </Modal>

            <ViewerModal 
                show={!!viewerImage} 
                image={viewerImage} 
                onClose={() => setViewerImage(null)} 
            />
        </AppLayout>
    );
}
