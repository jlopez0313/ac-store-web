import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataGrid } from '@/components/ui/DataTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Box, Layers, Search } from 'lucide-react';
import { useState } from 'react';
import { TallarCajaModal } from './TallarCajaModal';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Cajas', href: route('cajas.index') },
];

export default function Index({ filters, lista, bodegas }: any) {
	const {
		data: items,
		meta: { total, current_page, per_page },
	} = lista;

	const [selectedCaja, setSelectedCaja] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleSearch = (search?: string, page?: number, perPage?: number) => {
		router.visit(route('cajas.index', {
			search: search !== undefined ? search : filters.search,
			page: page ?? 1,
			per_page: perPage ?? filters.per_page ?? 25,
		}), { preserveState: true, preserveScroll: true });
	};

	const openTallarModal = (caja: any) => {
		setSelectedCaja(caja);
		setIsModalOpen(true);
	};

	const columns = [
		{
			name: 'Código',
			selector: (row: any) => row.referencia_codigo,
			sortable: true,
			width: '120px',
			cell: (row: any) => <span className="font-mono font-bold text-primary">{row.referencia_codigo}</span>,
		},
		{
			name: 'Producto',
			grow: 2,
			cell: (row: any) => (
				<div className="flex flex-col py-2">
					<span className="text-sm font-medium text-slate-900">{row.referencia_descripcion}</span>
					<span className="text-xs text-muted-foreground">Factura #{row.compra_id} ({row.compra_fecha})</span>
				</div>
			),
			sortable: true,
			noTruncate: true,
		},
		{
			name: 'Marca',
			selector: (row: any) => row.referencia_marca,
			sortable: true,
			width: '120px',
		},
		{
			name: 'Bodega',
			selector: (row: any) => row.bodega_nombre,
			sortable: true,
			width: '180px',
			cell: (row: any) => <span className="font-bold text-slate-900">{row.bodega_nombre}</span>,
		},
		{
			name: 'Unid/Caja',
			selector: (row: any) => row.pares_por_caja,
			center: true,
			width: '100px',
		},
		{
			name: 'Total Pares',
			selector: (row: any) => row.cantidad,
			right: true,
			width: '120px',
			cell: (row: any) => <span className="text-lg font-bold text-slate-900">{row.cantidad}</span>,
		},
		{
			name: 'P. Costo',
			selector: (row: any) => row.precio_compra,
			right: true,
			width: '120px',
			cell: (row: any) => <span className="font-semibold text-slate-600">${Number(row.precio_compra).toLocaleString()}</span>,
		},
		{
			name: 'P. Venta',
			selector: (row: any) => row.precio_venta,
			right: true,
			width: '120px',
			cell: (row: any) => <span className="font-semibold text-green-600">${Number(row.precio_venta).toLocaleString()}</span>,
		}
	];

	const actions = [
		{
			title: 'Tallar',
			icon: Layers,
			action: (id: number) => {
				const item = items.find((i: any) => i.id === id);
				if (item) openTallarModal(item);
			}
		}
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Cajas" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Control de Cajas"
					description="Gestiona las cajas de productos recibidas de proveedores pendientes por tallar."
				/>

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por código, descripción..."
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
						<Badge variant="secondary" className="px-3 py-1 text-xs">
							Registros: {total}
						</Badge>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
					<DataGrid
						data={items}
						columns={columns}
						total={total}
						currentPage={current_page}
						paginationPerPage={per_page}
						actions={actions}
						serverSide={true}
						paginationServer={true}
						fetchPage={(page) => handleSearch(undefined, page)}
						setPageSize={(size) => handleSearch(undefined, 1, size)}
						onSort={() => {}}
					/>
				</div>
			</div>

			<TallarCajaModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				caja={selectedCaja}
				bodegas={bodegas}
			/>
		</AppLayout>
	);
}
