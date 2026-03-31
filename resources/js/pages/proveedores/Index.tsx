import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash, Users } from 'lucide-react';
import { Form } from './Form';
import { DataGrid } from '@/components/ui/DataTable';
import { useAuth } from '@/hooks/use-auth';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Proveedores', href: route('proveedores.index') },
];

export default function Index({ filters, lista, cuentas, tipos_documento }: any) {
	const { isSuperAdmin } = useAuth();
	
	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('proveedores.destroy', { proveedore: params.id }) }) // proveedore is the default route binding variable
	);

	const columns = [
		{
			name: 'Nombre / Razón Social',
			selector: (row: any) => row.nombre,
			sortable: true,
			width: '250px',
		},
		{
			name: 'Documento',
			selector: (row: any) => `${row.tipo_documento} ${row.documento}`,
			sortable: true,
		},
		{
			name: 'Teléfono',
			selector: (row: any) => row.telefono || 'N/A',
		},
		{
			name: 'Correo',
			selector: (row: any) => row.correo || 'N/A',
		},
		...(isSuperAdmin ? [{
			name: 'Cuenta / Empresa',
			selector: (row: any) => row.cuenta?.nombre || 'N/A',
			sortable: true,
		}] : []),
		{
			name: 'Registrado',
			selector: (row: any) => row.created_at,
			sortable: true,
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
			action: (id: number) => onTrash(id),
		},
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Proveedores" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Proveedores"
					description="Gestión del catálogo de proveedores para compras y abastecimiento."
				/>
			</div>

			<div className="flex items-end justify-between px-4 pt-4">
				<Search filters={filters} ruta="proveedores" />
				<Button className="ms-4" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5" />
					Nuevo Proveedor
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

			<Modal show={show} closeable={true} title="Gestionar Proveedor">
				<Form
					id={id}
					cuentas={cuentas}
					tiposDocs={tipos_documento}
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
