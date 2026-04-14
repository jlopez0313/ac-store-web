import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Edit, Plus, Trash } from 'lucide-react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Marcas', href: route('marcas.index') },
];

export default function Index({ filters, lista }: any) {
    const {
        data,
        meta: { total, current_page, per_page },
    } = lista;

    const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
        lista,
        (params: any) => ({ url: route('api.marcas.destroy', { marca: params.id }) })
    );

    const columns = [
        {
            name: 'ID',
            selector: (row: any) => row.id,
            sortable: true,
        },
        {
            name: 'Nombre',
            selector: (row: any) => row.nombre,
            sortable: true,
        },
        {
            name: 'Cantidad de Referencias',
            selector: (row: any) => row.referencias_count || 0,
            sortable: true,
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
            action: (id: number) => onTrash(id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Marcas" />

            <div className="p-4 space-y-6">
                <PageHeader
                    title="Marcas"
                    description="Gestión de marcas para categorizar referencias de productos."
                />
            </div>

            <div className="flex items-end justify-between px-4 pt-4">
                <Search filters={filters} ruta="marcas" />
                <Button className="ms-4" onClick={() => onToggleModal(true)}>
                    <Plus className="h-5 w-5" />
                    Nueva Marca
                </Button>
            </div>

            <div className="p-4">
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    <DataGrid
                        data={data}
                        columns={columns}
                        total={total}
                        currentPage={current_page}
                        paginationPerPage={per_page || 25}
                        actions={actions}
                        processing={processing}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => onReload(page)}
                        onSort={() => { }}
                        setPageSize={(size) => onReload(null, size)}
                    />
                </div>
            </div>

            <Modal show={show} closeable={true} title="Gestionar Marca">
                <Form
                    id={id}
                    processing={processing}
                    onClose={() => onToggleModal(false)}
                    onStore={onStore}
                    onGetItem={onGetItem}
                    onReload={onReload}
                />
            </Modal>
        </AppLayout>
    );
}
