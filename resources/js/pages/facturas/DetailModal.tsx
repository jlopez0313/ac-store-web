import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { ChevronDown, ExternalLink, Image as ImageIcon, Info, RefreshCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	factura: any;
	onViewInvoice?: (id: number) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, factura, onViewInvoice }) => {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [showDevoluciones, setShowDevoluciones] = useState(false);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [viewerImage, setViewerImage] = useState<string | null>(null);

	const fetchDetails = async (page = 1, pageSize = perPage) => {
		if (!factura) return;
		setLoading(true);
		try {
			const response = await axios.get(route('api.ventas.detalles', { venta: factura.id }), {
				params: { page, per_page: pageSize }
			});
			setItems(response.data.data);
			setTotal(response.data.meta.total);
			setCurrentPage(response.data.meta.current_page);
		} catch (error) {
			console.error('Error fetching invoice details:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen && factura) {
			fetchDetails(1, perPage);
		} else if (!isOpen) {
			setViewerImage(null);
		}
	}, [isOpen, factura]);

	if (!factura) return null;

	const days = Math.floor(Math.abs(new Date().getTime() - new Date(factura.created_at).getTime()) / (1000 * 60 * 60 * 24));

	const columns = [
		{
			name: 'Foto',
			width: '85px',
			cell: (row: any) => (
				<button
					type="button"
					onClick={() => setViewerImage(row.producto.foto)}
					className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted transition-transform hover:scale-110 active:scale-95"
				>
					{row.producto.foto ? (
						<img src={row.producto.foto} alt="Product" className="h-full w-full object-cover" />
					) : (
						<ImageIcon className="h-4 w-4 text-muted-foreground" />
					)}
				</button>
			),
		},
		{
			name: 'Referencia',
			selector: (row: any) => row.producto.codigo,
			cell: (row: any) => (
				<div className="flex flex-col py-1">
					<span className="font-bold text-primary text-sm">{row.producto.codigo}</span>
					<span className="text-[10px] text-muted-foreground uppercase font-medium line-clamp-1">{row.producto.descripcion}</span>
				</div>
			),
		},
		{
			name: 'Talla',
			width: '80px',
			cell: (row: any) => (
				<span className="bg-muted border border-border px-2 py-1 rounded text-xs font-bold shadow-xs">
					{row.talla}
				</span>
			),
		},
		{
			name: 'Cant.',
			width: '80px',
			selector: (row: any) => row.cantidad,
			cell: (row: any) => <span className="font-bold text-muted-foreground">{row.cantidad}</span>
		},
		{
			name: 'Precio Unit.',
			selector: (row: any) => row.precio_unitario,
			cell: (row: any) => <span className="text-muted-foreground">${Number(row.precio_unitario).toLocaleString()}</span>
		},
		{
			name: 'Subtotal',
			selector: (row: any) => row.subtotal,
			cell: (row: any) => <span className="font-bold text-foreground">${Number(row.subtotal).toLocaleString()}</span>
		},
		{
			name: '',
			width: '80px',
			cell: (row: any) => (
				<div className="flex items-center justify-end pr-4">
					{row.cambio && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									className="p-2 rounded-lg transition-all text-amber-500 hover:bg-amber-50 data-[state=open]:bg-amber-100"
									title="Ver detalles del cambio"
								>
									<RefreshCcw className="w-4 h-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								side="top"
								sideOffset={12}
								className="w-72 p-4 bg-popover text-popover-foreground rounded-2xl shadow-2xl border-border z-[1001]"
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex flex-col">
										<span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Detalles del Cambio</span>
										<span className="text-[10px] text-muted-foreground font-bold uppercase">{row.cambio.usuario}</span>
									</div>
								</div>

								<div className="bg-muted rounded-md p-3 border border-border mb-4">
									<p className="text-[12px] leading-relaxed text-muted-foreground font-medium italic">
										"{row.cambio.observacion || 'Sin observaciones'}"
									</p>
								</div>

								{row.cambio.nueva_venta_id && (
									<button
										onClick={(e) => {
											e.preventDefault();
											onViewInvoice?.(row.cambio.nueva_venta_id);
										}}
										className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all border border-indigo-400/30 group/btn shadow-xl shadow-indigo-900/40"
									>
										<div className="flex items-center gap-2">
											<ExternalLink className="w-3.5 h-3.5 text-indigo-200 group-hover/btn:scale-110 transition-transform" />
											<span className="text-[11px] font-black uppercase tracking-tight">Ver Factura Nueva</span>
										</div>
										<span className="text-[10px] font-mono font-bold text-indigo-100 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10"># {row.cambio.nueva_venta_id}</span>
									</button>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			)
		}
	];

	return (
		<>
			<Modal
				show={isOpen}
				onClose={viewerImage ? () => { } : onClose}
				title={`Detalle de Factura #${factura.numero ?? factura.id}`}
				maxWidth="4xl"
				closeable={true}
			>
				<div className="bg-background">
					<div className="p-6 space-y-6">
						{/* Clean Header Summary */}
						<div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md p-5">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
								<div className="space-y-1">
									<span className="text-[10px] font-bold text-slate-400 uppercase">Vendedor</span>
									<p className="text-sm font-semibold">{factura.vendedor || 'Superadmin'}</p>
								</div>
								<div className="space-y-1">
									<span className="text-[10px] font-bold text-slate-400 uppercase">Local Destino</span>
									<p className="text-sm font-semibold">{factura.local?.name || 'N/A'}</p>
								</div>
								<div className="space-y-1">
									<span className="text-[10px] font-bold text-slate-400 uppercase">Bodega</span>
									<p className="text-sm font-semibold">{factura.bodega?.nombre || 'N/A'}</p>
								</div>
								<div className="space-y-1">
									<span className="text-[10px] font-bold text-slate-400 uppercase">Emisión</span>
									<p className="text-sm font-semibold">{new Date(factura.created_at).toLocaleDateString()}</p>
								</div>
								<div className="space-y-1">
									<span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
									<div className="pt-0.5">
										<Badge
											variant="outline"
											className={cn(
												'capitalize text-[11px] px-2 py-0',
												factura.estado === 'cerrada' ? 'badge-closed' : 'badge-open'
											)}
										>
											{factura.estado}
										</Badge>
									</div>
								</div>
								<div className="space-y-1">
									<span className="text-[10px] font-bold text-slate-400 uppercase">Antigüedad</span>
									<p className="text-sm font-semibold">{days} días</p>
								</div>
							</div>
						</div>

						{(factura.observaciones || factura.info_cambio) && (
							<div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 shadow-sm">
								<div className="flex items-start gap-3">
									<div className="mt-1 p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
										<Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
									</div>
									<div className="flex-1">
										<h4 className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-2">Observaciones / Notas</h4>

										{factura.info_cambio && (
											<div className="mb-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-amber-200/50">
												<span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
													🔄 Factura generada por cambio de la Factura #{factura.info_cambio.factura_original}
												</span>
												<p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 italic">
													"{factura.info_cambio.observacion}"
												</p>
											</div>
										)}

										{factura.observaciones && (
											<p className="text-sm text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
												{factura.observaciones}
											</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Items Table Section */}
						<div className="space-y-4">
							<h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
								Lista de Productos
							</h3>
							<div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
								<DataGrid
									fixedHeaderScrollHeight="400px"
									data={items}
									columns={columns}
									processing={loading}
									total={total}
									serverSide={true}
									paginationServer={true}
									currentPage={currentPage}
									paginationPerPage={perPage}
									fetchPage={(page) => fetchDetails(page, perPage)}
									setPageSize={(size) => {
										setPerPage(size);
										fetchDetails(1, size);
									}}
									onSort={() => { }}
								/>
							</div>
						</div>

						{/* Devoluciones Section (Accordion) */}
						{factura.devoluciones_detalle?.length > 0 && (
							<div className="space-y-3 pt-4">
								<button
									onClick={() => setShowDevoluciones(!showDevoluciones)}
									className="w-full flex items-center justify-between p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl transition-all hover:bg-rose-100/50 dark:hover:bg-rose-900/30 group"
								>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-rose-600 dark:text-rose-400">
											<RefreshCcw className={`h-4 w-4 ${showDevoluciones ? 'animate-spin-slow' : ''}`} />
										</div>
										<div className="text-left">
											<h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 uppercase tracking-tight">
												Productos Devueltos / Anulados
											</h3>
											<p className="text-[10px] text-rose-600/70 dark:text-rose-400/60 font-medium uppercase">
												{factura.devoluciones_detalle.length} {factura.devoluciones_detalle.length === 1 ? 'producto detectado' : 'productos detectados'}
											</p>
										</div>
									</div>
									<ChevronDown className={`h-5 w-5 text-rose-400 transition-transform duration-300 ${showDevoluciones ? 'rotate-180' : ''}`} />
								</button>

								{showDevoluciones && (
									<div className="bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-200 dark:border-rose-900/30 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
										<Table>
											<TableHeader className="bg-rose-100/50 dark:bg-rose-900/20">
												<TableRow>
													<TableHead className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Referencia</TableHead>
													<TableHead className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 text-center">Talla</TableHead>
													<TableHead className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Motivo</TableHead>
													<TableHead className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 text-right">Procesado Por</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{factura.devoluciones_detalle.map((dev: any) => (
													<TableRow key={dev.id} className="border-rose-100 dark:border-rose-900/20">
														<TableCell>
															<div className="flex flex-col">
																<span className="font-bold text-sm text-rose-900 dark:text-rose-200">{dev.producto}</span>
																<span className="text-[10px] text-rose-600/70 dark:text-rose-400/50 uppercase truncate max-w-[200px]">{dev.descripcion}</span>
															</div>
														</TableCell>
														<TableCell className="text-center font-bold text-rose-700 dark:text-rose-300">{dev.talla}</TableCell>
														<TableCell className="text-xs text-rose-600 dark:text-rose-400 italic">"{dev.motivo || 'Sin motivo'}"</TableCell>
														<TableCell className="text-right">
															<div className="flex flex-col items-end">
																<span className="text-xs font-bold text-rose-900 dark:text-rose-200">{dev.usuario}</span>
																<span className="text-[10px] text-rose-500 font-mono">{dev.fecha}</span>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</div>
						)}

						{/* Premium Footer Totals */}
						<div className="flex justify-end p-3 bg-muted rounded-2xl shadow-lg border border-border">
							<div className="text-right">
								<p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">VALOR TOTAL DE FACTURA</p>
								<p className="text-lg font-bold text-foreground">
									${Number(factura.total || 0).toLocaleString()}
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			<ViewerModal
				show={!!viewerImage}
				image={viewerImage}
				onClose={() => setViewerImage(null)}
			/>
		</>
	);
};
