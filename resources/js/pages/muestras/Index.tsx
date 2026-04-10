import { PageHeader } from '@/components/page-header';
import { Search } from '@/components/Search/Search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash } from 'lucide-react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Muestras', href: route('muestras.index') },
];

export default function Index({ filters, lista, cuentas, locals }: any) {
	const { isSuperAdmin } = useAuth();

	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('api.muestras.destroy', { muestra: params.id }) })
	);

	const columns = [
		{
			name: 'ID',
			selector: (row: any) => row.id,
			sortable: true,
			width: '80px',
		},
		{
			name: 'Fecha',
			selector: (row: any) => row.fecha,
			sortable: true,
		},
		{
			name: 'Local',
			selector: (row: any) => row.local?.name,
			sortable: true,
		},
		{
			name: 'Referencia',
			cell: (row: any) => (
				<div className="flex flex-col">
					<span className="font-bold">{row.referencia?.codigo}</span>
					<span className="text-[10px] text-slate-500 line-clamp-1">{row.referencia?.descripcion}</span>
				</div>
			),
			sortable: true,
		},
		{
			name: 'Talla',
			selector: (row: any) => row.variante,
			width: '80px',
		},
		{
			name: 'Ubicación Original',
			cell: (row: any) => (
				<div className="text-[10px] text-slate-600 leading-tight">
					<div>{row.bodega_original}</div>
					<div className="text-slate-400">Estante: {row.estante_original}</div>
				</div>
			),
			sortable: true,
		},
		{
			name: 'Etiquetas',
			cell: (row: any) => (
				<div className="flex flex-wrap gap-1">
					{row.etiquetas?.map((tag: string) => (
						<Badge key={tag} variant="outline" className="text-[10px] bg-slate-50 border-slate-200">
							{tag}
						</Badge>
					))}
				</div>
			),
			sortable: false,
		},
		{
			name: 'Estado',
			cell: (row: any) => (
				<Badge
					variant={row.estado === 'activo' ? 'outline' : 'default'}
					className={`text-[10px] uppercase font-bold ${
						row.estado === 'activo'
							? 'bg-green-50 text-green-700 border-green-200'
							: row.estado === 'vendido'
							? 'bg-amber-50 text-amber-700 border-amber-200'
							: 'bg-red-50 text-red-700 border-red-200'
					}`}
				>
					{row.estado}
				</Badge>
			),
			sortable: true,
			width: '100px',
		},
		...(isSuperAdmin ? [{
			name: 'Cuenta',
			selector: (row: any) => row.cuenta?.nombre,
		}] : []),
		{
			name: 'Registrado por',
			selector: (row: any) => row.creado_por,
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
			<Head title="Muestras" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Distribución de Muestras"
					description="Historial de muestras enviadas a locales."
				/>
			</div>

			<div className="flex items-end justify-between px-4 pt-4">
				<Search filters={filters} ruta="muestras" />
				<Button className="ms-4" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5" />
					Registrar Muestra
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

			<Modal show={show} closeable={true} title="Registrar Distribución de Muestra">
				<Form
					id={id}
					cuentas={cuentas}
					locals={locals}
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
