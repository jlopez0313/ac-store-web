import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit, Image as ImageIcon, Plus, Trash } from 'lucide-react';
import { Form } from './Form';
import { DataGrid } from '@/components/ui/DataTable';
import { useAuth } from '@/hooks/use-auth';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Referencias', href: route('referencias.index') },
];

export default function Index({ filters, lista, cuentas, categorias }: any) {
	const { isSuperAdmin } = useAuth();
	
	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('referencias.destroy', { referencia: params.id }) })
	);

	const columns = [
		{
			name: 'Foto',
			cell: (row: any) => (
				<div className="w-12 h-12 rounded overflow-hidden bg-slate-100 flex items-center justify-center my-1 border border-slate-200">
					{row.foto ? (
						<img src={row.foto} alt={row.codigo} className="w-full h-full object-cover" />
					) : (
						<ImageIcon className="w-6 h-6 text-slate-400" />
					)}
				</div>
			),
			width: '80px',
		},
		{
			name: 'Código',
			selector: (row: any) => row.codigo,
			sortable: true,
			width: '120px',
		},
		{
			name: 'Marca',
			selector: (row: any) => row.marca,
			sortable: true,
		},
		{
			name: 'Categoría',
			selector: (row: any) => row.categoria?.nombre || 'N/A',
		},
		...(isSuperAdmin ? [{
			name: 'Cuenta / Empresa',
			selector: (row: any) => row.cuenta?.nombre || 'N/A',
			sortable: true,
		}] : []),
		{
			name: 'Descripción',
			selector: (row: any) => row.descripcion || 'Sin descripción',
			wrap: true, // Allow description to wrap if it's long
		},
		{
			name: 'Creado',
			selector: (row: any) => row.created_at,
			sortable: true,
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
			action: (id: number) => onTrash(id),
		},
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Referencias" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Referencias (Productos)"
					description="Gestión del catálogo maestro de productos y variaciones."
				/>
			</div>

			<div className="flex items-end justify-between px-4 pt-4">
				<Search filters={filters} ruta="referencias" />
				<Button className="ms-4" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5" />
					Nueva Referencia
				</Button>
			</div>

			<div className="p-4">
				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
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

			<Modal show={show} closeable={true} title="Gestionar Referencia">
				<Form
					id={id}
					cuentas={cuentas}
					categorias={categorias}
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
