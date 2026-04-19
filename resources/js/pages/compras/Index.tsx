import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useCrudPage } from '@/hooks/useCrudPage';
import AppLayout from '@/layouts/app-layout';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Layers, Package, Plus, Search, ShoppingCart, Trash } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { AddDetailModal } from './AddDetailModal';
import { Form } from './Form';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Compras', href: route('compras.index') },
];

export default function Index({ filters: initialFilters, cuentas, proveedores, referencias, bodegas, next_id }: any) {
	const { isBodega } = useAuth();
	
	const [facturas, setFacturas] = useState<any[]>([]);
	const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
	const [loading, setLoading] = useState(true);
	
	const [filters, setFilters] = useState({
		search: initialFilters?.search || '',
		per_page: initialFilters?.per_page || 25,
		page: initialFilters?.page || 1,
	});

	const [selectedFactura, setSelectedFactura] = useState<any>(null);
	const [refSearch, setRefSearch] = useState('');
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedRef, setSelectedRef] = useState<any>(null);

	const fetchData = useCallback(async (newParams = {}) => {
		setLoading(true);
		const params = { ...filters, ...newParams };
		try {
			const response = await axios.get(route('api.compras.index'), { params });
			setFacturas(response.data.data);
			setMeta(response.data.meta);
		} catch (error) {
			console.error('Error fetching invoices:', error);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [filters.page, filters.per_page]);

	const handleSearch = (search: string) => {
		setFilters(prev => ({ ...prev, search, page: 1 }));
		fetchData({ search, page: 1 });
	};

	const openAdd = (ref: any) => {
		setSelectedRef(ref);
		setDetailModalOpen(true);
	};

	const handleDeleteDetail = async (detalleId: number) => {
		const result = await confirmDialog({
			title: '¿Estás seguro?',
			text: '¿Estás seguro de eliminar este producto del ingreso? El stock se ajustará.',
			icon: 'warning'
		});

		if (!result.isConfirmed) return;

		try {
			await axios.delete(route('api.compra_detalles.destroy', { compra: selectedFactura.id, detalle: detalleId }));
			
			// Update local state
			const updatedDetalles = selectedFactura.detalles.filter((d: any) => d.id !== detalleId);
			setSelectedFactura({ ...selectedFactura, detalles: updatedDetalles });
			
			showAlert('success', 'Producto eliminado correctamente.');
		} catch (error: any) {
			showAlert('error', error.response?.data?.error || 'Error al eliminar el detalle.');
		}
	};

	const availableRefs = (referencias || []).filter((r: any) => selectedFactura && r.cuenta_id === selectedFactura.cuenta_id);
	const refResults = availableRefs.filter((r: any) =>
		r.codigo.toLowerCase().includes(refSearch.toLowerCase()) ||
		r.descripcion.toLowerCase().includes(refSearch.toLowerCase())
	);

	const { id, show, processing, onToggleModal, onTrash, onStore, onGetItem, onSetItem } = useCrudPage(
		null,
		(params: any) => ({ url: route('api.compras.destroy', params.id) })
	);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Compras" />

			<div className="p-4 space-y-6">
				<PageHeader
					title="Módulo de Compras"
					description="Gestión de órdenes de compra, ingreso al inventario y liquidación."
				/>
			</div>

			<div className="flex items-end justify-between px-4">
				<div className="flex-1"></div>
				<Button className="" onClick={() => onToggleModal(true)}>
					<Plus className="h-5 w-5 mr-2" />
					Nueva Factura
				</Button>
			</div>

			<div className="p-4">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					{/* Left Panel: Lista de facturas */}
					<Card className="lg:col-span-1 flex flex-col h-[calc(100vh-16rem)] border-slate-200 shadow-sm overflow-hidden">
						<CardHeader className="pb-2 pt-4 px-4">
							<CardTitle className="text-sm">Facturas</CardTitle>
						</CardHeader>

						<CardContent className="p-2 flex-1 flex flex-col overflow-hidden">
							<div className="relative mb-2 shrink-0">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<input
									type="text"
									defaultValue={filters.search}
									placeholder="Buscar factura, proveedor..."
									className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
									onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
									onBlur={(e) => handleSearch(e.target.value)}
								/>
							</div>
							<div className="space-y-1 overflow-y-auto flex-1 pr-1">
								{loading && facturas.length === 0 ? (
									<div className="text-center py-6 text-slate-500 text-sm">Cargando...</div>
								) : facturas.length === 0 ? (
									<div className="text-center py-6 text-slate-500 text-sm">No hay facturas registradas.</div>
								) : null}
								{facturas.map((factura: any) => {
									const isSelected = selectedFactura?.id === factura.id;
									return (
										<button
											key={factura.id}
											onClick={() => setSelectedFactura(factura)}
											className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
										>
											<div className="flex items-center justify-between">
												<span className="font-semibold text-sm">Factura #{factura.id}</span>
												<Badge
													variant="outline"
													className={`text-xs capitalize ${isSelected ? 'border-white/40 text-white' : 'badge-open'}`}
												>
													{factura.estado}
												</Badge>
											</div>
											<div className={`text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
												{factura.proveedor?.nombre} — {new Date(factura.fecha_apertura).toLocaleDateString()}
											</div>
										</button>
									)
								})}
							</div>
							
							{/* Pagination Controls */}
							<div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2 shrink-0">
								<Button 
									variant="ghost" 
									size="sm" 
									disabled={filters.page === 1}
									onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
								>Anterior</Button>
								<span className="text-xs text-muted-foreground">Pág. {meta.current_page} de {Math.max(1, Math.ceil(meta.total / meta.per_page))}</span>
								<Button 
									variant="ghost" 
									size="sm" 
									disabled={filters.page >= Math.ceil(meta.total / meta.per_page)}
									onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
								>Siguiente</Button>
							</div>
						</CardContent>
					</Card>

					<div className="lg:col-span-2 space-y-3">
						{selectedFactura ? (
							<>
								<Card>
									<CardContent className="p-4 space-y-3">
										<div className="grid grid-cols-2 gap-3">
											<div>
												<Label className="text-xs text-muted-foreground">FACTURA N°</Label>
												<div className="text-2xl font-bold text-primary">#{selectedFactura.id}</div>
											</div>
											<div className="text-right">
												<Badge variant="outline" className={selectedFactura.estado === 'cerrada' ? 'badge-closed' : 'badge-open'}>
													{selectedFactura.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
												</Badge>
												<div className="text-xs text-muted-foreground mt-1">{selectedFactura.fecha_apertura}</div>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div>
												<Label className="text-xs">Proveedor</Label>
												<div className="text-sm font-medium">{selectedFactura.proveedor?.nombre}</div>
											</div>
											{!isBodega && (
												<div>
													<Label className="text-xs">Valor del Flete</Label>
													<div className="text-sm font-bold text-indigo-600">${Number(selectedFactura.flete || 0).toLocaleString()}</div>
												</div>
											)}
											<div className="col-span-2">
												<Label className="text-xs">Observaciones</Label>
												<div className="text-sm font-medium text-muted-foreground border border-slate-200 rounded-md p-2">{selectedFactura.observaciones ?? 'Sin observaciones'}</div>
											</div>
										</div>
										<div className="flex justify-end">
											<Button size="sm" onClick={() => onSetItem(selectedFactura.id)}>
												<Edit className="w-4 h-4 mr-2" />
												Editar Factura
											</Button>
										</div>
									</CardContent>
								</Card>

								{selectedFactura.estado === 'abierta' && (
									<Card>
										<CardContent className="p-3">
											<div className="relative mb-2">
												<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
												<Input className="pl-9 h-9" placeholder="Buscar referencia para agregar..." value={refSearch} onChange={e => setRefSearch(e.target.value)} />
											</div>
											{refSearch && (
												<div className="space-y-1 max-h-48 overflow-y-auto mt-2">
													{refResults.map((ref: any) => {
														return (
															<button
																key={ref.id}
																onClick={() => openAdd(ref)}
																className="w-full text-left flex items-center justify-between px-3 py-2 rounded hover:bg-muted text-sm"
															>
																<span>
																	<span className="font-mono font-semibold text-primary mr-2">{ref.codigo}</span>
																	{ref.descripcion}
																	<span className="ml-2 text-xs text-muted-foreground">({ref.categoria?.nombre})</span>
																</span>
															</button>
														);
													})}
													{refResults.length === 0 && (
														<p className="text-xs text-muted-foreground text-center py-2">Sin resultados</p>
													)}
												</div>
											)}
										</CardContent>
									</Card>
								)}

								<Card>
									<CardContent className="p-0 overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="w-20">Ref</TableHead>
													<TableHead>Descripción</TableHead>
													<TableHead className="w-36">Bodega destino</TableHead>
													<TableHead className="w-20 text-center">Modo</TableHead>
													<TableHead className="w-36 text-right">Cantidad</TableHead>
													<TableHead className="w-24 text-right">Costo unit.</TableHead>
													<TableHead className="w-24 text-right">Precio venta</TableHead>
													<TableHead className="w-24 text-right">Subtotal</TableHead>
													<TableHead className="w-8"></TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{selectedFactura.detalles?.map((detalle: any) => (
													<TableRow key={detalle.id}>
														<TableCell className="font-mono font-semibold text-primary text-sm">{detalle.producto?.codigo}</TableCell>
														<TableCell className="text-sm">
															<div>{detalle.producto?.descripcion}</div>
															{detalle.modo === 'cajas' && (
																<div className="text-xs text-muted-foreground">{detalle.numero_cajas} caja(s) × {detalle.pares_por_caja} pares</div>
															)}
															{detalle.modo === 'tallado' && (
																<div className="text-xs text-muted-foreground">
																	Tallado: {detalle.tallas.map((s: any) => `${s.size}×${s.qty}`).join(' · ')}
																</div>
															)}
														</TableCell>
														<TableCell className="text-xs text-muted-foreground">{bodegas?.find((b: any) => b.id == detalle.bodega_id)?.nombre || '-'}</TableCell>
														<TableCell className="text-center">
															{detalle.modo === 'cajas'
																? <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"><Package className="h-3 w-3" />Caja</span>
																: <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"><Layers className="h-3 w-3" />Tallado</span>
															}
														</TableCell>
														<TableCell className="text-right font-semibold text-sm">{detalle.cantidad}</TableCell>
														<TableCell className="text-right text-sm">${Number(detalle.precio_unitario).toLocaleString()}</TableCell>
														<TableCell className="text-right text-sm text-green-600">${Number(detalle.precio_venta).toLocaleString()}</TableCell>
														<TableCell className="text-right text-sm font-medium">${Number(detalle.subtotal).toLocaleString()}</TableCell>
														<TableCell className="text-right">
															<Button 
																variant="ghost" 
																size="icon" 
																className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" 
																onClick={() => handleDeleteDetail(detalle.id)}
															>
																<Trash className="w-4 h-4" />
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</>
						) : (
							<Card className="lg:col-span-2 h-[calc(100vh-16rem)] border-slate-200 shadow-sm flex items-center justify-center bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30">
								<div className="text-center text-slate-400 dark:text-slate-500">
									<ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
									<p className="text-sm">Selecciona una factura para ver sus detalles</p>
								</div>
							</Card>
						)}
					</div>
				</div>
			</div>

			<Modal show={show} closeable={true} title={id ? `Factura de Compra #${id}` : `Nueva Factura de Compra #${next_id}`}>
				<Form
					id={id}
					proveedores={proveedores}
					cuentas={cuentas}
					processing={processing}
					next_id={next_id}
					onClose={() => onToggleModal(false)}
					onStore={(storeFn: any, updateFn: any, data: any) => 
						onStore(storeFn, updateFn, data, false).then(() => {
							onToggleModal(false);
							fetchData();
						})
					}
					onGetItem={(params: any) => onGetItem(() => ({ url: route('api.compras.show', params.id) }), {})}
					onReload={fetchData}
					onSuccess={(factura: any) => {
						setSelectedFactura(factura);
						fetchData();
					}}
				/>
			</Modal>

			<AddDetailModal
				isOpen={detailModalOpen}
				onClose={() => setDetailModalOpen(false)}
				referencia={selectedRef}
				factura={selectedFactura}
				bodegas={bodegas}
				onAdded={(nuevoDetalle: any) => {
					const updatedFactura = { ...selectedFactura };
					if (!updatedFactura.detalles) updatedFactura.detalles = [];
					updatedFactura.detalles.push(nuevoDetalle);
					setSelectedFactura(updatedFactura);
					setRefSearch('');
				}}
			/>
		</AppLayout >
	);
}
