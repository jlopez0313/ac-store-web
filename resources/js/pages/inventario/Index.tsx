import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import AppLayout from '@/layouts/app-layout';
import { showAlert } from '@/plugins/sweetalert';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Eye, Image as ImageIcon, Search, Warehouse } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdjustmentModal } from './AdjustmentModal';
import { DetailModal } from './DetailModal';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Inventario', href: route('inventario.index') },
];

export default function Index({ filters: initialFilters }: any) {
	const { auth } = usePage().props as any;
	const canAdjust = ['superadmin', 'admin'].includes(auth.user.role);

	const [items, setItems] = useState<any[]>([]);
	const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

	const [filters, setFilters] = useState({
		search: initialFilters?.search || '',
		per_page: initialFilters?.per_page || 25,
		sort_field: initialFilters?.sort_field || 'id',
		sort_order: initialFilters?.sort_order || 'desc',
		page: initialFilters?.page || 1,
	});

	const [selectedReferencia, setSelectedReferencia] = useState<any>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	// Adjustment related state
	const [adjustmentOpen, setAdjustmentOpen] = useState(false);
	const [selectedShelf, setSelectedShelf] = useState<any>(null);
	const [distributionDetails, setDistributionDetails] = useState<any[]>([]);
	const [shelfSelectorOpen, setShelfSelectorOpen] = useState(false);
	const [viewerImage, setViewerImage] = useState<string | null>(null);

	const fetchData = useCallback(async (newParams = {}) => {
		setLoading(true);
		const params = { ...filters, ...newParams };
		try {
			const response = await axios.get(route('api.inventario.index'), { params });
			setItems(response.data.data);
			setMeta(response.data.meta);
		} catch (error) {
			console.error('Error fetching inventory:', error);
			showAlert('error', 'No se pudieron cargar los datos del inventario.');
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [filters.page, filters.per_page, filters.sort_field, filters.sort_order]);

	const handleSearch = (search: string) => {
		setFilters(prev => ({ ...prev, search, page: 1 }));
		fetchData({ search, page: 1 });
	};

	const handleAdjustFromIndex = async (referencia: any) => {
		setSelectedReferencia(referencia);
		setActionLoading(true);
		try {
			const response = await axios.get(route('api.inventario.detail', { referencia: referencia.id }));
			const details = response.data.data;

			if (details.length === 0) {
				showAlert('warning', 'Este producto no tiene existencias registradas en ninguna estantería.');
				return;
			}

			setDistributionDetails(details);

			// Group by unique shelf
			const uniqueShelves = details.reduce((acc: any[], current: any) => {
				const x = acc.find(item => item.estanteria_id === current.estanteria_id);
				if (!x) acc.push(current);
				return acc;
			}, []);

			if (uniqueShelves.length === 1) {
				const item = uniqueShelves[0];
				setSelectedShelf({
					id: item.estanteria_id,
					nombre: item.estanteria_nombre,
					bodega_nombre: item.bodega_nombre,
				});
				setAdjustmentOpen(true);
			} else {
				setShelfSelectorOpen(true);
			}
		} catch (error) {
			console.error('Error fetching details:', error);
			showAlert('error', 'No se pudieron cargar los detalles para el ajuste.');
		} finally {
			setActionLoading(false);
		}
	};

	const columns = [
		{
			name: 'Foto',
			width: '80px',
			cell: (row: any) => (
				<button
					type="button"
					onClick={() => row.foto && setViewerImage(row.foto)}
					className="my-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-border bg-muted transition-transform hover:scale-110 active:scale-95"
				>
					{row.foto ? (
						<img src={row.foto} alt={row.codigo} className="h-full w-full object-cover" />
					) : (
						<ImageIcon className="h-5 w-5 text-slate-400" />
					)}
				</button>
			),
		},
		{
			name: 'Código',
			selector: (row: any) => row.codigo,
			sortable: true,
			sortField: 'codigo',
			width: '140px',
			cell: (row: any) => <span className="font-bold">{row.codigo}</span>,
		},
		{
			name: 'Producto',
			grow: 1.5,
			selector: (row: any) => row.descripcion,
			sortable: true,
			sortField: 'descripcion',
		},
		{
			name: 'Marca',
			selector: (row: any) => row.marca?.nombre || 'N/A',
			sortable: true,
			sortField: 'marca',
			width: '120px',
		},
		{
			name: 'Stock Total',
			width: '150px',
			selector: (row: any) => row.total_stock,
			cell: (row: any) => (
				<span className={`font-bold ${Number(row.total_stock) <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
					{row.total_stock || 0}
				</span>
			),
			sortable: true,
			sortField: 'total_stock',
		},
		{
			name: 'Precio de Venta Sugerido',
			width: '240px',
			selector: (row: any) => row.precio_venta,
			cell: (row: any) => <span className="font-semibold text-green-600">${Number(row.precio_venta || 0).toLocaleString()}</span>,
			sortable: true,
			sortField: 'precio_venta',
		}
	];

	const actions = [
		...(canAdjust ? [{
			title: 'Ajustar',
			icon: Edit,
			isLoading: (id: any, row: any) => actionLoading && selectedReferencia?.id === row.id,
			action: (id: any, row: any) => handleAdjustFromIndex(row)
		}] : []),
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

				<div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
					<div className="flex flex-1 max-w-sm gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="search-input"
								placeholder="Buscar por código, descripción, marca..."
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
							<Search className="h-4 w-4 mr-2" />
							Buscar
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="px-3 py-1 text-xs">
							Total referencias: {meta.total}
						</Badge>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
					<DataGrid
						data={items}
						columns={columns}
						total={meta.total}
						currentPage={meta.current_page}
						paginationPerPage={meta.per_page}
						actions={actions}
						serverSide={true}
						paginationServer={true}
						processing={loading}
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

			<DetailModal
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				referencia={selectedReferencia}
				onAdjust={(shelf: any, details: any[]) => {
					setSelectedShelf(shelf);
					setDistributionDetails(details);
					setIsDetailModalOpen(false);
					setAdjustmentOpen(true);
				}}
			/>

			{/* Shelf Selection Modal */}
			<Modal
				show={shelfSelectorOpen}
				onClose={() => setShelfSelectorOpen(false)}
				title="Seleccionar Ubicación para Ajuste"
				maxWidth="lg"
				closeable={true}
			>
				<div className="p-6 space-y-4">
					<p className="text-sm text-muted-foreground">
						Este producto se encuentra en múltiples ubicaciones. Seleccione una para ajustar:
					</p>
					<div className="grid gap-2">
						{[...new Map(distributionDetails.map(item => [item.estanteria_id, item])).values()].map((shelf: any) => (
							<button
								key={shelf.estanteria_id}
								onClick={() => {
									setSelectedShelf({
										id: shelf.estanteria_id,
										nombre: shelf.estanteria_nombre,
										bodega_nombre: shelf.bodega_nombre
									});
									setShelfSelectorOpen(false);
									setAdjustmentOpen(true);
								}}
								className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left group"
							>
								<div className="p-2 bg-muted rounded-lg group-hover:bg-background transition-colors">
									<Warehouse className="h-5 w-5 text-muted-foreground" />
								</div>
								<div className="flex flex-col flex-1">
									<span className="font-medium text-sm">{shelf.bodega_nombre}</span>
									<span className="text-xs text-muted-foreground uppercase">{shelf.estanteria_nombre}</span>
								</div>
								<Badge variant="outline" className="bg-background">
									{distributionDetails.filter(d => d.estanteria_id === shelf.estanteria_id).reduce((sum, d) => sum + Number(d.stock), 0)} uds
								</Badge>
							</button>
						))}
					</div>
				</div>
			</Modal>

			{selectedShelf && (
				<AdjustmentModal
					isOpen={adjustmentOpen}
					onClose={() => setAdjustmentOpen(false)}
					onSuccess={() => {
						setAdjustmentOpen(false);
						fetchData();
					}}
					referencia={selectedReferencia}
					estanteria={selectedShelf}
					items={distributionDetails.filter(d => d.estanteria_id === selectedShelf.id)}
				/>
			)}

			<ViewerModal
				show={!!viewerImage}
				image={viewerImage}
				onClose={() => setViewerImage(null)}
			/>
		</AppLayout>
	);
}
