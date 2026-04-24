import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { DataGrid } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, Clock, ExternalLink, House, Image as ImageIcon, MapPin, RefreshCcw, Tag, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ViewerModal } from '@/components/ui/ViewerModal';
import axios from 'axios';

interface DetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	factura: any;
	onViewInvoice?: (id: number) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, factura, onViewInvoice }) => {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [viewerImage, setViewerImage] = useState<string | null>(null);

	const fetchDetails = async (page = 1, pageSize = perPage) => {
		if (!factura) return;
		setLoading(true);
		try {
			const response = await axios.get(route('api.ventas.detalles', factura.id), {
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
			width: '80px',
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
					<span className="font-mono font-bold text-primary text-sm">{row.producto.codigo}</span>
					<span className="text-[10px] text-muted-foreground uppercase font-medium line-clamp-1">{row.producto.descripcion}</span>
				</div>
			),
		},
		{
			name: 'Talla',
			width: '80px',
			center: true,
			cell: (row: any) => (
				<span className="bg-muted border border-border px-2 py-1 rounded text-xs font-bold shadow-xs">
					{row.talla}
				</span>
			),
		},
		{
			name: 'Cant.',
			width: '80px',
			right: true,
			selector: (row: any) => row.cantidad,
			cell: (row: any) => <span className="font-bold text-muted-foreground">{row.cantidad}</span>
		},
		{
			name: 'Precio Unit.',
			right: true,
			selector: (row: any) => row.precio_unitario,
			cell: (row: any) => <span className="text-muted-foreground">${Number(row.precio_unitario).toLocaleString()}</span>
		},
		{
			name: 'Subtotal',
			right: true,
			selector: (row: any) => row.subtotal,
			cell: (row: any) => <span className="font-bold text-foreground">${Number(row.subtotal).toLocaleString()}</span>
		},
		{
			name: '',
			width: '60px',
			right: true,
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
								
								<div className="bg-muted rounded-xl p-3 border border-border mb-4">
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
										className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all border border-indigo-400/30 group/btn shadow-xl shadow-indigo-900/40"
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
			onClose={onClose}
			title={`Detalle de Factura #${factura.id}`}
			maxWidth="4xl"
			closeable={true}
		>
			<div className="max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background">
				<div className="p-6 space-y-8">
					{/* Premium Header Decoration */}
					<div className="relative">
						<div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />

						<div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
										<User className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Vendedor</span>
										<span className="text-sm font-bold text-foreground">{factura.vendedor || 'Superadmin'}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
										<MapPin className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Local Destino</span>
										<span className="text-sm font-bold text-foreground">{factura.local?.name || 'N/A'}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
										<Calendar className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Emisión</span>
										<span className="text-sm font-bold text-foreground">{new Date(factura.created_at).toLocaleDateString()}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
										<Tag className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Estado</span>
										<Badge variant={factura.estado === 'cerrada' ? 'default' : 'outline'} className="capitalize mt-0.5 w-fit">
											{factura.estado}
										</Badge>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
										<House className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Bodega</span>
										<span className="text-sm font-bold text-foreground">{factura.bodega?.nombre || 'N/A'}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
										<Clock className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">Antigüedad</span>
										<span className="text-sm font-bold text-foreground">{days} días</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Items Table Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-medium text-foreground uppercase flex items-center gap-2">
							Lista de Productos
						</h3>
						<div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm min-h-[400px]">
							<DataGrid
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
								onSort={() => {}}
							/>
						</div>
					</div>

					{/* Premium Footer Totals */}
					<div className="flex justify-end p-6 bg-muted rounded-2xl shadow-lg border border-border">
						<div className="text-right">
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">VALOR TOTAL DE FACTURA</p>
							<p className="text-2xl font-medium tracking-tighter text-foreground">
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
