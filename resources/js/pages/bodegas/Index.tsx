import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Edit, Trash } from 'lucide-react';
import { Form } from './Form';
import { DataGrid } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Bodegas', href: route('bodegas.index') },
];

export default function Index({ filters, lista, estados, cuentas }: any) {
	const { isSuperAdmin } = useAuth();

	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('bodegas.destroy', { bodega: params.id }) })
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
			name: 'Dirección',
			selector: (row: any) => row.direccion || 'Sin dirección',
			sortable: true,
		},
		...(isSuperAdmin ? [{
			name: 'Cuenta / Empresa',
			selector: (row: any) => row.cuenta?.nombre || 'N/A',
			sortable: true,
		}] : []),
		{
			name: 'Estado',
			cell: (row: any) => (
				<Badge variant={row.estado ? 'default' : 'destructive'}>
					{row.estado ? 'Activa' : 'Inactiva'}
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
			<Head title="Bodegas" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Bodegas"
					description="Gestión de almacenes y bodegas del sistema."
				/>
			</div>

			<div className="flex items-end justify-between px-4 pt-4">
				<Search filters={filters} ruta="bodegas" />
				<Button className="ms-4" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5" />
					Nueva Bodega
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

			<Modal show={show} closeable={true} title="Gestionar Bodega">
				<Form
					id={id}
					estados={estados}
					cuentas={cuentas}
					processing={processing}
					setIsOpen={onToggleModal}
					onStore={onStore}
					onGetItem={onGetItem}
					onReload={onReload}
				/>
			</Modal>
		</AppLayout>
	);
}
