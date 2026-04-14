import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { DetailModal } from './DetailModal';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Inventario', href: route('inventario.index') },
];

export default function Index({ filters, lista }: any) {
	const {
		data: items,
		meta: { total, current_page, per_page },
	} = lista;

	const [selectedReferencia, setSelectedReferencia] = useState<any>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	const handleSearch = (search?: string, page?: number, perPage?: number) => {
		router.visit(route('inventario.index', {
			search: search !== undefined ? search : filters.search,
			page: page ?? 1,
			per_page: perPage ?? filters.per_page ?? 25,
		}), { preserveState: true, preserveScroll: true });
	};

	const columns = [
		{
			name: 'Código',
			selector: (row: any) => row.codigo,
			sortable: true,
			width: '140px',
			cell: (row: any) => <span className="font-mono font-bold text-indigo-600">{row.codigo}</span>,
		},
		{
			name: 'Producto',
			grow: 1.5,
			selector: (row: any) => row.descripcion,
			sortable: true,
		},
		{
			name: 'Marca',
			selector: (row: any) => row.marca?.nombre || 'N/A',
			sortable: true,
			width: '120px',
		},
		{
			name: 'Stock Total',
			width: '150px',
			cell: (row: any) => (
				<span className={`font-bold ${Number(row.total_stock) <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
					{row.total_stock || 0}
				</span>
			),
			sortable: true,
		},
		{
			name: 'Precio de Venta Sugerido',
			width: '240px',
			cell: (row: any) => <span className="font-semibold text-green-600">${Number(row.precio_venta || 0).toLocaleString()}</span>,
			sortable: true,
		}
	];

	const actions = [
		{
			title: 'Ver Detalle',
			icon: Eye,
			action: (id: any, row: any) => {
				setSelectedReferencia(row);
				setIsDetailModalOpen(true);
			}
		}
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Inventario" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Inventario General"
					description="Visualiza el stock disponible agrupado por referencia y marca."
				/>

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por código, descripción, marca..."
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
							Total referencias: {total}
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
						onSort={() => { }}
					/>
				</div>
			</div>

			<DetailModal
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				referencia={selectedReferencia}
			/>
		</AppLayout>
	);
}
