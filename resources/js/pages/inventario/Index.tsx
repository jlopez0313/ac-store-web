import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeftRight, Search } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Inventario', href: route('inventario.index') },
];

export default function Index({ filters, lista }: any) {
	const {
		data: items,
		meta: { total, current_page, per_page },
	} = lista;

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
			selector: (row: any) => row.referencia_codigo,
			sortable: true,
			width: '120px',
			cell: (row: any) => <span className="font-mono font-bold text-primary">{row.referencia_codigo}</span>,
		},
		{
			name: 'Producto',
			grow: 1.5,
			selector: (row: any) => row.referencia_descripcion,
			sortable: true,
		},
		{
			name: 'Marca',
			selector: (row: any) => row.referencia_marca,
			sortable: true,
			width: '120px',
		},
		{
			name: 'Ubicación',
			grow: 1.2,
			cell: (row: any) => (
				<div className="flex flex-col py-2">
					<span className="font-medium text-slate-900">{row.bodega_nombre}</span>
					<span className="text-xs text-slate-500">{row.estanteria_nombre}</span>
				</div>
			),
			sortable: true,
			noTruncate: true,
		},
		{
			name: 'Talla',
			width: '100px',
			cell: (row: any) => <Badge variant="outline" className="font-mono bg-white text-slate-700 border-slate-200">{row.talla}</Badge>,
			sortable: true,
		},
		{
			name: 'Stock',
			width: '100px',
			cell: (row: any) => (
				<span className={`font-medium ${row.stock <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
					{row.stock}
				</span>
			),
			sortable: true,
		},
		{
			name: 'P. Costo',
			width: '120px',
			cell: (row: any) => <span className="font-semibold text-slate-600">${Number(row.precio_compra).toLocaleString()}</span>,
			sortable: true,
		},
		{
			name: 'P. Venta',
			width: '120px',
			cell: (row: any) => <span className="font-semibold text-green-600">${Number(row.precio_venta).toLocaleString()}</span>,
			sortable: true,
		}
	];

	const actions = [
		{
			title: 'Trasladar',
			icon: ArrowLeftRight,
			action: (id: number) => {
				// Implement transfer logic or open modal
				console.log('Trasladar', id);
			}
		}
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Inventario" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Inventario General"
					description="Visualiza el stock disponible por referencia, talla y ubicación."
				/>

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por código, descripción, talla..."
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
							Total registros: {total}
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
		</AppLayout>
	);
}
