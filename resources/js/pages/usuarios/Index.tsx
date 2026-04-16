import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash } from 'lucide-react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Usuarios', href: route('usuarios.index') },
];

export default function Index({ filters, lista, roles, cuentas, estados }: any) {
	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('usuarios.destroy', { usuario: params.id }) })
	);

	const columns = [
		{
			name: 'ID',
			selector: (row: any) => row.id,
			sortable: true,
			width: '70px',
		},
		{
			name: 'Nombre',
			selector: (row: any) => row.name,
			sortable: true,
		},
		{
			name: 'Usuario',
			selector: (row: any) => row.username,
			sortable: true,
		},
		{
			name: 'Email',
			selector: (row: any) => row.email,
			sortable: true,
		},
		{
			name: 'Rol',
			cell: (row: any) => (
				<Badge variant="outline" className="capitalize">
					{row.role || 'Sin rol'}
				</Badge>
			),
			sortable: true,
		},
		{
			name: 'Cuenta',
			selector: (row: any) => row.cuenta?.nombre || 'N/A',
			sortable: true,
		},
		{
			name: 'Ciudad',
			selector: (row: any) => row.ciudad?.name ? `${row.ciudad.name} (${row.ciudad.state?.country?.name || ''})` : 'N/A',
			sortable: true,
		},
		{
			name: 'Estado',
			cell: (row: any) => (
				<Badge variant={row.estado ? 'default' : 'destructive'}>
					{row.estado ? 'Activo' : 'Inactivo'}
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
			<Head title="Usuarios" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Usuarios"
					description="Gestión de usuarios del sistema."
				/>
			</div>

			<div className="flex items-center justify-between px-4 pt-4">
				<div className="flex items-center gap-4 flex-1">
					<Search filters={filters} ruta="usuarios" />
				</div>
				<Button className="ms-4" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5" />
					Nuevo Usuario
				</Button>
			</div>

			<div className="p-4">
				<div className="bg-background rounded-xl shadow-xs border border-border overflow-hidden">
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
						onSort={(column, direction) => {
							const params = new URLSearchParams(window.location.search);
							params.set('sort', column.name?.toString().toLowerCase() || '');
							params.set('order', direction);
							router.visit(`${window.location.pathname}?${params.toString()}`, { preserveScroll: true });
						}}
						setPageSize={(size) => onReload(null, size)}
					/>
				</div>
			</div>

			<Modal show={show} closeable={true} title="Gestionar Usuario">
				<Form
					id={id}
					onClose={() => onToggleModal(false)}
					onStore={onStore}
					onReload={onReload}
					onGetItem={onGetItem}
					roles={roles}
					cuentas={cuentas}
					estados={estados}
				/>
			</Modal>
		</AppLayout>
	);
}
