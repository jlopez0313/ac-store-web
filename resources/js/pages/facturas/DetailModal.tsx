import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, Clock, ExternalLink, House, MapPin, RefreshCcw, Tag, User } from 'lucide-react';
import React from 'react';

interface DetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	factura: any;
	onViewInvoice?: (id: number) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, factura, onViewInvoice }) => {
	if (!factura) return null;

	const days = Math.floor(Math.abs(new Date().getTime() - new Date(factura.created_at).getTime()) / (1000 * 60 * 60 * 24));

	return (
		<Modal
			show={isOpen}
			onClose={onClose}
			title={`Detalle de Factura #${factura.id}`}
			maxWidth="4xl"
			closeable={true}
		>
			<div className="max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
				<div className="p-6 space-y-8">
					{/* Premium Header Decoration */}
					<div className="relative">
						<div className="absolute inset-0 bg-indigo-500/5 blur-3xl -z-10 rounded-full" />

						<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500">
										<User className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Vendedor</span>
										<span className="text-sm font-bold text-slate-900">{factura.vendedor || 'Superadmin'}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500">
										<MapPin className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Local Destino</span>
										<span className="text-sm font-bold text-slate-900">{factura.local?.name || 'N/A'}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500">
										<Calendar className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Emisión</span>
										<span className="text-sm font-bold text-slate-900">{new Date(factura.created_at).toLocaleDateString()}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500">
										<Tag className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Estado</span>
										<Badge variant={factura.estado === 'cerrada' ? 'default' : 'outline'} className="capitalize mt-0.5 w-fit">
											{factura.estado}
										</Badge>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500">
										<House className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Bodega</span>
										<span className="text-sm font-bold text-slate-900">{factura.bodega?.nombre || 'N/A'}</span>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500">
										<Clock className="h-5 w-5" />
									</div>
									<div className="flex flex-col">
										<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Antigüedad</span>
										<span className="text-sm font-bold text-slate-900">{days} días</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Items Table Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-medium text-slate-900 uppercase flex items-center gap-2">
							Lista de Productos
						</h3>
						<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
									<TableRow>
										<TableHead className="font-bold text-slate-700 h-12 bg-slate-50">Referencia</TableHead>
										<TableHead className="text-center font-bold text-slate-700 h-12 bg-slate-50">Talla</TableHead>
										<TableHead className="text-right font-bold text-slate-700 h-12 bg-slate-50">Cant.</TableHead>
										<TableHead className="text-right font-bold text-slate-700 h-12 bg-slate-50">Precio Unit.</TableHead>
										<TableHead className="text-right font-bold text-slate-700 h-12 bg-slate-50">Subtotal</TableHead>
										<TableHead className="w-10 bg-slate-50 h-12 pr-6"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{factura.detalles?.map((detalle: any) => (
										<TableRow key={detalle.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
											<TableCell>
												<div className="flex flex-col py-1">
													<span className="font-mono font-bold text-indigo-600 text-sm">{detalle.producto.codigo}</span>
													<span className="text-[10px] text-slate-500 uppercase font-medium">{detalle.producto.descripcion}</span>
												</div>
											</TableCell>
											<TableCell className="text-center">
												<span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-bold shadow-xs">
													{detalle.talla}
												</span>
											</TableCell>
											<TableCell className="text-right font-bold text-slate-600">{detalle.cantidad}</TableCell>
											<TableCell className="text-right text-slate-600">${Number(detalle.precio_unitario).toLocaleString()}</TableCell>
											<TableCell className="text-right font-bold text-slate-900">
												${Number(detalle.subtotal).toLocaleString()}
											</TableCell>
											<TableCell className="p-0 pr-6">
												<div className="flex items-center justify-end">
													{detalle.cambio && (
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
																className="w-72 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border-slate-800 z-[1001]"
															>
																<div className="flex items-center justify-between mb-3">
																	<div className="flex flex-col">
																		<span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Detalles del Cambio</span>
																		<span className="text-[10px] text-slate-400 font-bold uppercase">{detalle.cambio.usuario}</span>
																	</div>
																</div>
																
																<div className="bg-white/5 rounded-xl p-3 border border-white/5 mb-4">
																	<p className="text-[12px] leading-relaxed text-slate-200 font-medium italic">
																		"{detalle.cambio.observacion || 'Sin observaciones'}"
																	</p>
																</div>
																
																{detalle.cambio.nueva_venta_id && (
																	<button 
																		onClick={(e) => {
																			e.preventDefault();
																			onViewInvoice?.(detalle.cambio.nueva_venta_id);
																		}}
																		className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all border border-indigo-400/30 group/btn shadow-xl shadow-indigo-900/40"
																	>
																		<div className="flex items-center gap-2">
																			<ExternalLink className="w-3.5 h-3.5 text-indigo-200 group-hover/btn:scale-110 transition-transform" />
																			<span className="text-[11px] font-black uppercase tracking-tight">Ver Factura Nueva</span>
																		</div>
																		<span className="text-[10px] font-mono font-bold text-indigo-100 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10"># {detalle.cambio.nueva_venta_id}</span>
																	</button>
																)}
															</DropdownMenuContent>
														</DropdownMenu>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>

					{/* Premium Footer Totals */}
					<div className="flex justify-end p-6 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
						<div className="text-right">
							<p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">VALOR TOTAL DE FACTURA</p>
							<p className="text-2xl font-medium tracking-tighter">
								${Number(factura.total || 0).toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};
