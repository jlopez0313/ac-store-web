import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeftRight, Search } from 'lucide-react';
import { useState } from 'react';
import { TransferModal } from './TransferModal';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Traslados', href: route('traslados.index') },
];

export default function Index({ filters, lista, cuentas, referencias }: any) {
	const {
		data: items,
		meta: { total, current_page, per_page },
	} = lista;

	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleSearch = (search?: string, page?: number, perPage?: number) => {
		router.visit(route('traslados.index', {
			search: search !== undefined ? search : filters.search,
			page: page ?? 1,
			per_page: perPage ?? filters.per_page ?? 25,
		}), { preserveState: true, preserveScroll: true });
	};

	const columns = [
		{
			name: 'Producto',
			grow: 1.5,
			cell: (row: any) => (
				<div className="flex flex-col py-2">
					<div className="font-mono font-bold text-primary">{row.referencia_codigo}</div>
					<div className="text-xs text-muted-foreground truncate max-w-[200px]">{row.referencia_descripcion}</div>
				</div>
			),
			sortable: true,
			noTruncate: true,
		},
		{
			name: 'Talla',
			width: '100px',
			selector: (row: any) => row.talla,
			sortable: true,
		},
		{
			name: 'Origen',
			grow: 1.2,
			cell: (row: any) => (
				<div className="flex flex-col py-2">
					<div className="text-sm font-medium text-slate-900">{row.bodega_origen}</div>
					<div className="text-xs text-slate-500 font-mono italic">{row.estanteria_origen}</div>
				</div>
			),
			sortable: true,
			noTruncate: true,
		},
		{
			name: 'Destino',
			grow: 1.2,
			cell: (row: any) => (
				<div className="flex flex-col py-2">
					<div className="text-sm font-medium text-slate-900">{row.bodega_destino}</div>
					<div className="text-xs text-slate-500 font-mono italic">{row.estanteria_destino}</div>
				</div>
			),
			sortable: true,
			noTruncate: true,
		},
		{
			name: 'Cant.',
			width: '100px',
			cell: (row: any) => <span className="font-bold text-slate-900">{row.cantidad}</span>,
			sortable: true,
		},
		{
			name: 'Responsable',
			selector: (row: any) => row.usuario_nombre,
			sortable: true,
		},
		{
			name: 'Fecha',
			width: '120px',
			selector: (row: any) => row.fecha,
			sortable: true,
		}
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Traslados de Inventario" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Historial de Traslados"
					description="Registro de movimientos de mercancía entre bodegas y estanterías."
				/>

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por código, descripción, usuario..."
							className="pl-9"
							defaultValue={filters.search}
							onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
							onBlur={(e) => {
								if (e.target.value !== (filters.search || '')) {
									handleSearch(e.target.value);
								}
							}}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={() => setIsModalOpen(true)}>
							<ArrowLeftRight className="h-4 w-4 mr-2" />
							Nuevo Traslado
						</Button>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
					<DataGrid
						data={items}
						columns={columns}
						total={total}
						currentPage={current_page}
						paginationPerPage={per_page}
						serverSide={true}
						paginationServer={true}
						fetchPage={(page) => handleSearch(undefined, page)}
						setPageSize={(size) => handleSearch(undefined, 1, size)}
						onSort={() => { }}
					/>
				</div>
			</div>

			<TransferModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				cuentas={cuentas}
				referenciasInit={referencias}
			/>
		</AppLayout>
	);
}
