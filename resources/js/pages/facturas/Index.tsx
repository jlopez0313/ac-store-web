import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { DollarSign, Eye, Search as SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

// Sub-components
import { DetailModal } from './DetailModal';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Facturas', href: route('facturas.index') },
];

export default function Index({ lista, filters, gran_total }: any) {
	const { data, meta } = lista;
	const [searchValue, setSearchValue] = useState(filters.search || '');
	const [selectedFactura, setSelectedFactura] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleViewInvoice = (id: number) => {
		setIsModalOpen(false);
		router.visit(route('facturas.index', { ...filters, search: id, page: 1 }), {
			preserveState: true,
			onSuccess: () => {
				setSearchValue(id.toString());
			}
		});
	};

	// Auto-open modal if search matches a single record
	useEffect(() => {
		if (filters.search && data.length > 0) {
			const found = data.find((f: any) => f.id == filters.search);
			if (found) {
				setSelectedFactura(found);
				setIsModalOpen(true);
			}
		}
	}, [filters.search, data]);

	const tabs = [
		{ id: 'todas', label: 'Todas' },
		{ id: 'abiertas', label: 'Abiertas' },
		{ id: 'cerradas', label: 'Cerradas' },
		{ id: 'pendientes', label: 'Pendientes' },
		{ id: 'sin_precio', label: 'Sin Precio' },
	];

	const handleSearch = (tab?: string) => {
		router.visit(route('facturas.index', {
			...filters,
			search: searchValue,
			tab: tab || filters.tab || 'todas',
			page: 1
		}), { preserveState: true });
	};

	const columns = [
		{
			name: 'ID',
			selector: (row: any) => row.id,
			sortable: true,
			width: '70px',
		},
		{
			name: 'Fecha',
			selector: (row: any) => row.fecha || '-',
			sortable: true,
		},
		{
			name: 'Vendedor',
			selector: (row: any) => row.vendedor || '-',
			sortable: true,
		},
		{
			name: 'Local',
			selector: (row: any) => row.local?.name || 'N/A',
			sortable: true,
		},
		{
			name: 'Bodega',
			selector: (row: any) => row.bodega?.nombre || 'N/A',
			sortable: true,
		},
		{
			name: 'Saldo',
			selector: (row: any) => row.total || 0,
			sortable: true,
			cell: (row: any) => `$${Number(row.total || 0).toLocaleString()}`
		},
		{
			name: 'Días',
			selector: (row: any) => {
				const start = new Date(row.created_at);
				const end = new Date();
				const diffTime = Math.abs(end.getTime() - start.getTime());
				return Math.floor(diffTime / (1000 * 60 * 60 * 24));
			},
			sortable: true,
		},
		{
			name: 'Estado',
			selector: (row: any) => row.estado,
			sortable: true,
			cell: (row: any) => (
				<Badge variant={row.estado === 'cerrada' ? 'default' : 'outline'} className="capitalize">
					{row.estado}
				</Badge>
			),
		}
	];

	const actions = [
		{
			title: 'Ver detalle',
			icon: Eye,
			action: (id: any) => {
				const row = data.find((r: any) => r.id === id);
				if (row) {
					setSelectedFactura(row);
					setIsModalOpen(true);
				}
			},
		}
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Facturas" />

			<div className="p-4 space-y-6">
				<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
					<PageHeader
						title="Gestión de Facturas"
						description="Historial de facturas de venta."
					/>

					<div className="flex bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-md items-center gap-5 transition-all hover:shadow-lg self-end md:self-start">
						<div className="bg-indigo-600 h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
							<DollarSign className="h-4 w-4" />
						</div>
						<div>
							<p className="text-[10px] font-medium text-slate-400 uppercase leading-none mb-1.5">Total Acumulado</p>
							<p className="text-xl font-bold text-slate-900 leading-none tracking-tighter">
								${Number(gran_total).toLocaleString()}
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex items-center gap-2 flex-1 max-w-md">
						<div className="relative flex-1">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar..."
								className="pl-9"
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
							/>
						</div>
						<Button variant="outline" onClick={() => handleSearch()}>Buscar</Button>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="flex bg-slate-100 p-1 rounded-lg">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => handleSearch(tab.id)}
									className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${(filters.tab || 'todas') === tab.id
										? 'bg-white text-slate-900 shadow-sm'
										: 'text-slate-500 hover:text-slate-700'
										}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
					<DataGrid
						data={data}
						columns={columns}
						total={meta?.total || data.length}
						serverSide={true}
						paginationServer={true}
						currentPage={meta?.current_page || 1}
						paginationPerPage={meta?.per_page || 25}
						fetchPage={(page) => router.visit(route('facturas.index', { ...filters, page }), { preserveState: true })}
						onSort={() => { }}
						setPageSize={(size) => router.visit(route('facturas.index', { ...filters, per_page: size, page: 1 }), { preserveState: true })}
						actions={actions as any}
					/>
				</div>
			</div>

			<DetailModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				factura={selectedFactura}
				onViewInvoice={handleViewInvoice}
			/>
		</AppLayout>
	);
}
