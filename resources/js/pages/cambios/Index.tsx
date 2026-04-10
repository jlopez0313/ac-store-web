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
import { ArrowRight, RefreshCcw } from 'lucide-react';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Cambios', href: route('cambios.index') },
];

export default function Index({ filters, lista, cuentas, locals }: any) {
	const { isSuperAdmin } = useAuth();

	const {
		data,
		meta: { total, current_page, per_page },
	} = lista;

	const { id, show, processing, onToggleModal, onReload, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		lista,
		(params: any) => ({ url: route('api.muestras.destroy', { muestra: params.id }) }) // TODO: Implement api.cambios.destroy if needed
	);

	const columns = [
		{
			name: 'ID',
			selector: (row: any) => row.id,
			sortable: true,
			width: '70px',
		},
		{
			name: 'Fecha',
			selector: (row: any) => row.fecha ? new Date(row.fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
			sortable: true,
		},
		{
			name: 'Local',
			selector: (row: any) => row.local?.name,
			sortable: true,
		},
		{
			name: 'Original',
			cell: (row: any) => (
				<div className="flex flex-col">
					<span className="font-bold text-slate-700">Factura #{row.venta_id}</span>
					<span className="text-[10px] text-red-500 uppercase font-bold">
						-{row.detalle_original?.producto?.codigo}
						<span className="text-slate-400 ml-1">(Talla: {row.detalle_original?.talla})</span>
					</span>
				</div>
			),
		},
		{
			name: 'Cambio por',
			cell: (row: any) => (
				<div className="flex items-center gap-2">
					<ArrowRight className="h-3 w-3 text-slate-400" />
					<div className="flex flex-col">
						<span className="font-bold text-green-600">{row.producto_nuevo?.codigo}</span>
						<span className="text-[10px] text-slate-500">Talla: {row.talla_nueva}</span>
					</div>
				</div>
			),
		},
		{
			name: 'Diferencia',
			cell: (row: any) => (
				<Badge variant={row.diferencia > 0 ? 'default' : 'outline'} className={row.diferencia > 0 ? "bg-amber-100 text-amber-700 border-amber-200" : ""}>
					${Number(row.diferencia).toLocaleString()}
				</Badge>
			),
		},
		{
			name: 'Registrado por',
			selector: (row: any) => row.creado_por_name || 'N/A', // TODO: Add to backend if not using resource
		},
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Cambios" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Gestión de Cambios"
					description="Historial de devoluciones y cambios de productos."
				/>
			</div>

			<div className="flex items-end justify-between px-4 pt-4">
				<Search filters={filters} ruta="cambios" />
				<Button className="ms-4 text-white" onClick={() => onToggleModal(true)}>
					<RefreshCcw className="h-4 w-4 mr-2" />
					Registrar Cambio
				</Button>
			</div>

			<div className="p-4 w-full max-w-full overflow-hidden flex flex-col min-w-0">
				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto w-full min-w-0">
					<DataGrid
						data={data}
						columns={columns}
						total={total}
						currentPage={current_page}
						paginationPerPage={per_page}
						actions={[]} // Exchanges are usually not editable
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

			<Modal show={show} closeable={true} title="Registrar Nuevo Cambio" maxWidth="4xl">
				<Form
					cuentas={cuentas}
					locals={locals}
					processing={processing}
					onClose={() => onToggleModal(false)}
					onStore={onStore}
					onReload={onReload}
				/>
			</Modal>
		</AppLayout>
	);
}
