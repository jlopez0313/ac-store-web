import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import axios from 'axios';
import { Info, Package, Tag, Warehouse } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	referencia: any;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, referencia }) => {
	const [details, setDetails] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen && referencia) {
			fetchDetails();
		}
	}, [isOpen, referencia]);

	const fetchDetails = async () => {
		setLoading(true);
		try {
			const response = await axios.get(route('api.inventario.detail', referencia.id));
			setDetails(response.data.data);
		} catch (error) {
			console.error('Error fetching inventory details:', error);
		} finally {
			setLoading(false);
		}
	};

	if (!referencia) return null;

	const warehouseTotals = details.reduce((acc: any, item: any) => {
		const key = item.bodega_nombre;
		if (!acc[key]) acc[key] = 0;
		acc[key] += Number(item.stock);
		return acc;
	}, {});

	return (
		<Modal
			show={isOpen}
			onClose={onClose}
			title={`Detalle de Inventario: ${referencia.codigo}`}
			maxWidth="4xl"
			closeable={true}
		>
			<div className="max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background">
				<div className="p-6 space-y-8">
					{/* Header Info */}
					<div className="bg-muted/30 border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
						{referencia.foto && (
							<div className="w-24 h-24 rounded-2xl overflow-hidden border border-border bg-background flex-shrink-0 shadow-sm transition-transform hover:scale-105 duration-300">
								<img
									src={referencia.foto}
									alt={referencia.codigo}
									className="w-full h-full object-cover"
									onError={(e) => {
										// Fallback if image fails to load
										(e.target as HTMLImageElement).src = '/images/placeholder-product.png';
									}}
								/>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
							<div className="flex items-center gap-4">
								<div className="h-10 w-10 flex items-center justify-center bg-background rounded-xl text-muted-foreground border border-border/50 flex-shrink-0">
									<Package className="h-5 w-5" />
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-medium text-muted-foreground uppercase leading-none mb-1">Producto</span>
									<span className="text-sm font-medium text-foreground line-clamp-2 md:line-clamp-1">{referencia.descripcion}</span>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="h-10 w-10 flex items-center justify-center bg-background rounded-xl text-muted-foreground border border-border/50 flex-shrink-0">
									<Tag className="h-5 w-5" />
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-medium text-muted-foreground uppercase leading-none mb-1">Marca</span>
									<span className="text-sm font-medium text-foreground">{typeof referencia.marca === 'object' ? referencia.marca.nombre : (referencia.marca || 'N/A')}</span>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="h-10 w-10 flex items-center justify-center bg-background rounded-xl text-muted-foreground border border-border/50 flex-shrink-0">
									<Info className="h-5 w-5" />
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-medium text-muted-foreground uppercase leading-none mb-1">Stock Total</span>
									<span className={`text-sm font-medium ${Number(referencia.total_stock) <= 0 ? 'text-red-500' : 'text-foreground'}`}>
										{referencia.total_stock} unidades
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Totals by Warehouse Summary */}
					{!loading && details.length > 0 && (
						<div className="space-y-4">
							<h3 className="text-sm font-medium text-foreground uppercase flex items-center gap-2">
								Resumen por Bodega
							</h3>
							<div className="flex flex-wrap gap-3">
								{Object.entries(warehouseTotals).map(([bodega, total]: any) => (
									<div key={bodega} className="bg-background border border-border px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-3">
										<div className="p-1.5 bg-primary/10 rounded-lg">
											<Warehouse className="h-3.5 w-3.5 text-primary" />
										</div>
										<div className="flex flex-col">
											<span className="text-[10px] font-medium text-muted-foreground uppercase leading-none mb-1">{bodega}</span>
											<span className="text-xs font-medium text-foreground leading-none">{total} <span className="text-[10px] text-muted-foreground font-medium">unidades</span></span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Table Details */}
					<div className="space-y-4">
						<h3 className="text-sm font-medium text-foreground uppercase flex items-center gap-2">
							Distribución por Bodega y Talla
						</h3>

						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
							</div>
						) : details.length === 0 ? (
							<div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border text-muted-foreground">
								No se encontraron registros detallados de inventario.
							</div>
						) : (
							<div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
								<Table>
									<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
										<TableRow>
											<TableHead className="font-bold text-foreground h-12 bg-muted/50">Bodega / Estantería</TableHead>
											<TableHead className="text-center font-bold text-foreground h-12 bg-muted/50">Talla</TableHead>
											<TableHead className="text-center font-bold text-foreground h-12 bg-muted/50">Stock</TableHead>
											<TableHead className="text-right font-bold text-foreground h-12 bg-muted/50">Precio Costo</TableHead>
											<TableHead className="text-right font-bold text-foreground h-12 bg-muted/50 pr-6">Precio Venta</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{details.map((item: any) => (
											<TableRow key={item.id} className="hover:bg-muted/20 transition-colors border-border/50">
												<TableCell>
													<div className="flex items-center gap-3">
														<div className="p-2 bg-muted rounded-lg text-muted-foreground">
															<Warehouse className="h-4 w-4" />
														</div>
														<div className="flex flex-col">
															<span className="font-medium text-foreground text-sm">{item.bodega_nombre}</span>
															<span className="text-[10px] text-muted-foreground uppercase">{item.estanteria_nombre}</span>
														</div>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Badge variant="outline" className="bg-background border-border font-mono">
														{item.talla}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<span className={`font-bold ${item.stock <= 0 ? 'text-red-500' : 'text-foreground'}`}>
														{item.stock}
													</span>
												</TableCell>
												<TableCell className="text-right text-muted-foreground font-medium">
													${Number(item.precio_compra).toLocaleString()}
												</TableCell>
												<TableCell className="text-right font-medium text-foreground pr-6">
													${Number(item.precio_venta).toLocaleString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
};
