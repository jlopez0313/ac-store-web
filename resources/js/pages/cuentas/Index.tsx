import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Edit, Plus, Trash, Search as SearchIcon } from 'lucide-react';
import { Form } from './Form';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Cuentas', href: route('cuentas.index') },
];

export default function Index({ filters: initialFilters, estados, default_account_price }: any) {
	const [items, setItems] = useState<any[]>([]);
	const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
	const [loading, setLoading] = useState(true);
	
	const [filters, setFilters] = useState({
		search: initialFilters?.search || '',
		per_page: initialFilters?.per_page || 25,
		sort_field: initialFilters?.sort_field || 'id',
		sort_order: initialFilters?.sort_order || 'desc',
		page: initialFilters?.page || 1,
	});

	const fetchData = useCallback(async (newParams = {}) => {
		setLoading(true);
		const params = { ...filters, ...newParams };
		try {
			const response = await axios.get(route('api.cuentas.index'), { params });
			setItems(response.data.data);
			setMeta(response.data.meta);
		} catch (error) {
			console.error('Error fetching accounts:', error);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [filters.page, filters.per_page, filters.sort_field, filters.sort_order]);

	const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		null,
		(params: any) => ({ url: route('api.cuentas.destroy', params.id) })
	);

	const handleSearch = (search: string) => {
		setFilters(prev => ({ ...prev, search, page: 1 }));
		fetchData({ search, page: 1 });
	};

	const columns = [
		{
			name: 'ID',
			selector: (row: any) => row.id,
			sortable: true,
			sortField: 'id',
			width: '80px',
		},
		{
			name: 'Nombre',
			selector: (row: any) => row.nombre,
			sortable: true,
			sortField: 'nombre',
		},
		{
			name: 'Precio Suscripción',
			selector: (row: any) => `$${Number(row.precio_suscripcion || 0).toLocaleString()}`,
			sortable: true,
			sortField: 'precio_suscripcion',
		},
		{
			name: 'Fecha de Vencimiento',
			selector: (row: any) => row.fecha_vencimiento,
			sortable: true,
			sortField: 'fecha_vencimiento',
		},
		{
			name: 'Estado',
			cell: (row: any) => (
				<Badge variant={row.estado ? 'default' : 'destructive'}>
					{row.estado ? 'Activo' : 'Inactivo'}
				</Badge>
			),
			sortable: true,
			sortField: 'estado',
		},
		{
			name: 'Creado',
			selector: (row: any) => row.created_at,
			sortable: true,
			sortField: 'created_at',
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
			action: (id: number) => onTrash(id).then(() => fetchData()),
		},
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Cuentas" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Cuentas"
					description="Gestión de cuentas del sistema."
				/>

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por nombre..."
							className="pl-9"
							defaultValue={filters.search}
							onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
							onBlur={(e) => handleSearch(e.target.value)}
						/>
					</div>
					<Button onClick={() => onToggleModal(true)}>
						<Plus className="h-5 w-5 mr-2" />
						Nueva Cuenta
					</Button>
				</div>

				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
					<DataGrid
						data={items}
						columns={columns}
						total={meta.total}
						currentPage={meta.current_page}
						paginationPerPage={meta.per_page}
						actions={actions}
						processing={loading}
						serverSide={true}
						paginationServer={true}
						fetchPage={(page) => setFilters(prev => ({ ...prev, page }))}
						setPageSize={(per_page) => setFilters(prev => ({ ...prev, per_page, page: 1 }))}
						onSort={(column: any, sortOrder) => {
							setFilters(prev => ({ 
								...prev, 
								sort_field: column.sortField, 
								sort_order: sortOrder,
								page: 1 
							}));
						}}
					/>
				</div>
			</div>

			<Modal show={show} closeable={true} title="Gestionar Cuenta">
				<Form
					id={id}
					estados={estados}
					processing={processing}
					setIsOpen={onToggleModal}
					onStore={(storeFn: any, updateFn: any, data: any) => 
						onStore(storeFn, updateFn, data, false).then(() => {
							onToggleModal(false);
							fetchData();
						})
					}
					onGetItem={(params: any) => onGetItem(() => ({ url: route('api.cuentas.show', params.id) }), {})}
					onReload={fetchData}
					default_account_price={default_account_price}
				/>
			</Modal>
		</AppLayout>
	);
}
