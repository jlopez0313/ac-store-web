import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Edit, Plus, Trash, Search as SearchIcon } from 'lucide-react';
import { Form } from './Form';
import { DataGrid } from '@/components/ui/DataTable';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Proveedores', href: route('proveedores.index') },
];

export default function Index({ filters: initialFilters, cuentas, tipos_documento }: any) {
	const { isSuperAdmin } = useAuth();
	
	const [items, setItems] = useState<any[]>([]);
	const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
	const [loading, setLoading] = useState(true);
	
	const [filters, setFilters] = useState({
		search: initialFilters?.search || '',
		per_page: initialFilters?.per_page || 25,
		sort_field: initialFilters?.sort_field || 'nombre',
		sort_order: initialFilters?.sort_order || 'asc',
		page: initialFilters?.page || 1,
	});

	const fetchData = useCallback(async (newParams = {}) => {
		setLoading(true);
		const params = { ...filters, ...newParams };
		try {
			const response = await axios.get(route('api.proveedores.index'), { params });
			setItems(response.data.data);
			setMeta(response.data.meta);
		} catch (error) {
			console.error('Error fetching providers:', error);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [filters.page, filters.per_page, filters.sort_field, filters.sort_order]);

	const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		null,
		(params: any) => ({ url: route('api.proveedores.destroy', params.id) })
	);

	const handleSearch = (search: string) => {
		setFilters(prev => ({ ...prev, search, page: 1 }));
		fetchData({ search, page: 1 });
	};

	const columns = [
		{
			name: 'Nombre / Razón Social',
			selector: (row: any) => row.nombre,
			sortable: true,
			sortField: 'nombre',
			width: '250px',
		},
		{
			name: 'Documento',
			selector: (row: any) => `${row.tipo_documento} ${row.documento}`,
			sortable: true,
			sortField: 'documento',
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
			sortField: 'cuenta_id',
		}] : []),
		{
			name: 'Registrado',
			selector: (row: any) => row.created_at,
			sortable: true,
			sortField: 'created_at',
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
			action: (id: number) => onTrash(id).then(() => fetchData()),
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

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por nombre, documento..."
							className="pl-9"
							defaultValue={filters.search}
							onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
							onBlur={(e) => handleSearch(e.target.value)}
						/>
					</div>
					<Button onClick={() => onToggleModal(true)}>
						<Plus className="h-5 w-5 mr-2" />
						Nuevo Proveedor
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

			<Modal show={show} closeable={true} title="Gestionar Proveedor">
				<Form
					id={id}
					cuentas={cuentas}
					tiposDocs={tipos_documento}
					processing={processing}
					onClose={() => onToggleModal(false)}
					onStore={(storeFn: any, updateFn: any, data: any) => 
						onStore(storeFn, updateFn, data, false).then(() => {
							onToggleModal(false);
							fetchData();
						})
					}
					onGetItem={(params: any) => onGetItem(() => ({ url: route('api.proveedores.show', params.id) }), {})}
					onReload={fetchData}
				/>
			</Modal>
		</AppLayout>
	);
}
