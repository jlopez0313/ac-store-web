import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash } from 'lucide-react';
import { Form } from './Form';
import { DataGrid } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Categorías', href: route('categorias.index') },
];

export default function Index({ filters, lista, tipos_control, tipos_muestras }: any) {
	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('categorias.destroy', { categoria: params.id }) })
	);

	const columns = [
		{
			name: 'ID',
			selector: (row: any) => row.id,
			sortable: true,
			width: '80px',
		},
		{
			name: 'Nombre',
			selector: (row: any) => row.nombre,
			sortable: true,
		},
		{
			name: 'Prefijo SKU',
			selector: (row: any) => row.prefijo_sku,
			sortable: true,
			width: '120px',
		},
		{
			name: 'Modo Control',
			cell: (row: any) => (
				<Badge variant="outline" className="capitalize">
					{row.tipo_control}
				</Badge>
			),
			sortable: true,
		},
		{
			name: 'Subdivisión',
			cell: (row: any) => (
				<Badge variant={row.subdivision_stock ? 'default' : 'secondary'}>
					{row.subdivision_stock ? 'Sí' : 'No'}
				</Badge>
			),
			sortable: true,
		},
		{
			name: 'Creado',
			selector: (row: any) => row.created_at,
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
			<Head title="Categorías" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Categorías"
					description="Gestión de categorías de productos, variaciones y stock."
				/>
			</div>

			<div className="flex items-end justify-between px-4 pt-4">
				<Search filters={filters} ruta="categorias" />
				<Button className="ms-4" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5" />
					Nueva Categoría
				</Button>
			</div>

			<div className="p-4">
				<div className="bg-background rounded-xl shadow-xs border border-border overflow-hidden">
					<DataGrid
						data={data}
						columns={columns}
						total={total}
						currentPage={current_page}
						paginationPerPage={per_page}
						actions={actions}
						processing={processing}
						serverSide={true}
						paginationServer={true}
						fetchPage={(page) => onReload(page)}
						setPageSize={(size) => onReload(null, size)}
						onSort={(column, direction) => {
							const params = new URLSearchParams(window.location.search);
							params.set('sort', column.name?.toString().toLowerCase() || '');
							params.set('order', direction);
							router.visit(`${window.location.pathname}?${params.toString()}`, { preserveScroll: true });
						}}
					/>
				</div>
			</div>

			<Modal show={show} closeable={true} title="Gestionar Categoría">
				<Form
					id={id}
					tipos_control={tipos_control}
					tipos_muestras={tipos_muestras}
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
