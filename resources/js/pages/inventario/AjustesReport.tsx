import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Search as SearchIcon, ArrowRight, User } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Inventario', href: route('inventario.index') },
	{ title: 'Reporte de Ajustes', href: route('inventario.ajustes') },
];

export default function AjustesReport({ filters: initialFilters }: any) {
	const [items, setItems] = useState<any[]>([]);
	const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
	const [loading, setLoading] = useState(true);
	
	const [filters, setFilters] = useState({
		search: initialFilters?.search || '',
		from: initialFilters?.from || '',
		to: initialFilters?.to || '',
		per_page: initialFilters?.per_page || 25,
		page: initialFilters?.page || 1,
	});

	const fetchData = useCallback(async (newParams = {}) => {
		setLoading(true);
		const params = { ...filters, ...newParams };
		try {
			const response = await axios.get(route('api.inventario.ajustes'), { params });
			setItems(response.data.data);
			setMeta(response.data.meta);
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [filters.page, filters.per_page, filters.from, filters.to]);

	const handleSearch = (search: string) => {
		setFilters(prev => ({ ...prev, search, page: 1 }));
		fetchData({ search, page: 1 });
	};

	const handleFilterChange = (key: string, value: any) => {
		setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
	};

	const columns = [
		{
			name: 'Fecha',
			selector: (row: any) => row.created_at,
			width: '180px',
			cell: (row: any) => (
				<div className="flex flex-col">
					<span className="font-medium">{new Date(row.created_at).toLocaleDateString()}</span>
					<span className="text-[10px] text-muted-foreground uppercase">{new Date(row.created_at).toLocaleTimeString()}</span>
				</div>
			),
		},
		{
			name: 'Usuario',
			selector: (row: any) => row.creador?.name,
			width: '150px',
			cell: (row: any) => (
				<div className="flex items-center gap-2">
					<User className="h-3 w-3 text-muted-foreground" />
					<span className="text-sm font-medium">{row.creador?.name || 'N/A'}</span>
				</div>
			),
		},
		{
			name: 'Referencia',
			grow: 1.5,
			cell: (row: any) => (
				<div className="flex flex-col">
					<span className="font-mono font-bold text-indigo-600">{row.referencia?.codigo}</span>
					<span className="text-xs text-muted-foreground line-clamp-1">{row.referencia?.descripcion}</span>
				</div>
			),
		},
		{
			name: 'Ubicación',
			width: '180px',
			cell: (row: any) => (
				<div className="flex flex-col">
					<span className="text-sm font-medium">{row.estanteria?.bodega?.nombre}</span>
					<span className="text-[10px] text-muted-foreground uppercase">{row.estanteria?.nombre}</span>
				</div>
			),
		},
		{
			name: 'Cambios Precios',
			width: '200px',
			cell: (row: any) => (
				<div className="flex flex-col gap-1 py-2">
					<div className="flex items-center gap-2 text-[10px] bg-slate-100 px-2 py-0.5 rounded">
						<span className="font-medium w-12 lowercase text-muted-foreground">Costo:</span>
						<span>${Number(row.precio_compra_anterior).toLocaleString()}</span>
						<ArrowRight className="h-2.5 w-2.5" />
						<span className="font-bold">${Number(row.precio_compra_nuevo).toLocaleString()}</span>
					</div>
					<div className="flex items-center gap-2 text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-700">
						<span className="font-medium w-12 lowercase text-indigo-400">Venta:</span>
						<span>${Number(row.precio_venta_anterior).toLocaleString()}</span>
						<ArrowRight className="h-2.5 w-2.5" />
						<span className="font-bold">${Number(row.precio_venta_nuevo).toLocaleString()}</span>
					</div>
				</div>
			),
		},
		{
			name: 'Ajuste de Stock',
			grow: 1.2,
			cell: (row: any) => (
				<div className="flex flex-wrap gap-1 py-2">
					{row.detalle_stock?.map((d: any) => (
						<Badge key={d.talla} variant="outline" className="text-[10px] flex items-center gap-1 bg-background border-border">
							<span className="font-mono">{d.talla}:</span>
							<span className="text-muted-foreground line-through">{d.anterior}</span>
							<ArrowRight className="h-2 w-2" />
							<span className="font-bold text-primary">{d.nuevo}</span>
						</Badge>
					))}
				</div>
			),
		},
		{
			name: 'Observación',
			grow: 1,
			selector: (row: any) => row.observacion,
			cell: (row: any) => <p className="text-xs text-muted-foreground italic leading-tight">{row.observacion}</p>,
		},
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Reporte de Ajustes de Inventario" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Historial de Ajustes"
					description="Consulta todos los cambios realizados manualmente en el stock y precios de inventario."
				/>

				<div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
					<div className="flex items-center gap-2 flex-1 min-w-[300px]">
						<div className="relative flex-1">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="search-input"
								placeholder="Buscar por código o descripción..."
								className="pl-9"
								defaultValue={filters.search}
								onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
							/>
						</div>
						<Button
							variant="secondary"
							onClick={() => {
								const val = (document.getElementById('search-input') as HTMLInputElement)?.value;
								handleSearch(val);
							}}
						>
							<SearchIcon className="h-4 w-4 mr-2" />
							Buscar
						</Button>
					</div>
					
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-muted-foreground">Desde</span>
							<Input 
								type="date" 
								className="w-40" 
								defaultValue={filters.from}
								onChange={(e) => handleFilterChange('from', e.target.value)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-muted-foreground">Hasta</span>
							<Input 
								type="date" 
								className="w-40" 
								defaultValue={filters.to}
								onChange={(e) => handleFilterChange('to', e.target.value)}
							/>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
					<DataGrid
						data={items}
						columns={columns}
						total={meta.total}
						processing={loading}
						currentPage={meta.current_page}
						paginationPerPage={meta.per_page}
						serverSide={true}
						paginationServer={true}
						fetchPage={(page) => setFilters(prev => ({ ...prev, page }))}
						setPageSize={(size) => setFilters(prev => ({ ...prev, per_page: size, page: 1 }))}
						onSort={() => {}}
					/>
				</div>
			</div>
		</AppLayout>
	);
}
