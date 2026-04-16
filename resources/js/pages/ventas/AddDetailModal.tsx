import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Box, ChevronLeft, Image as ImageIcon, Minus, Package, Plus, Search, Tag, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';

export const AddDetailModal = ({ isOpen, onClose, referencia, referencias, factura, bodegas, bodega_accesos, onAdded }: any) => {
	const { auth } = usePage().props as any;
	const [mode, setMode] = useState<'search' | 'detail'>('search');
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRef, setSelectedRef] = useState<any>(null);
	const [allStock, setAllStock] = useState<any[]>([]);
	const [loadingStock, setLoadingStock] = useState(false);
	const [saving, setSaving] = useState(false);
	const [quantities, setQuantities] = useState<Record<string, number>>({});

	const [selectedBodegaId, setSelectedBodegaId] = useState<number | null>(null);
	const [selectedTalla, setSelectedTalla] = useState<string | null>(null);

	// Reset state when opening or prop change
	useEffect(() => {
		if (isOpen) {
			if (referencia) {
				handleSelectRef(referencia);
			} else {
				setMode('search');
				setSearchTerm('');
				setSelectedRef(null);
				setQuantities({});
				setSelectedBodegaId(null);
				setSelectedTalla(null);
			}
		}
	}, [isOpen, referencia]);

	const permittedBodegaIds = useMemo(() => {
		if (!factura || !bodega_accesos) return new Set<number>();
		return new Set(
			bodega_accesos
				?.filter((a: any) => a.user_id === factura.local?.id && a.can_view)
				.map((a: any) => a.bodega_id)
		);
	}, [bodega_accesos, factura]);

	const availableTallas = useMemo(() => {
		const set = new Set<string>();
		referencias?.forEach((r: any) => r.stock_breakdown?.forEach((s: any) => set.add(s.talla)));
		return Array.from(set).sort();
	}, [referencias]);

	const fetchStock = async (ref: any) => {
		setLoadingStock(true);
		try {
			const response = await axios.get(`/api/inventario/stock`, {
				params: { referencia_id: ref.id }
			});
			setAllStock(response.data.data || []);
		} catch (error) {
			console.error("Error fetching stock:", error);
			setAllStock([]);
		} finally {
			setLoadingStock(false);
		}
	};


	const handleSelectRef = (ref: any) => {
		setSelectedRef(ref);
		setMode('detail');
		fetchStock(ref);
	};

	const filteredRefs = useMemo(() => {
		if (!referencias) return [];

		return referencias.map((r: any) => {
			let breakdown = (r.stock_breakdown || []).filter((s: any) =>
				permittedBodegaIds.has(parseInt(s.bodega_id))
			);

			if (selectedBodegaId) breakdown = breakdown.filter((s: any) => parseInt(s.bodega_id) === selectedBodegaId);
			if (selectedTalla) breakdown = breakdown.filter((s: any) => s.talla === selectedTalla);

			return {
				...r,
				displayStock: breakdown.reduce((acc: number, curr: any) => acc + (parseInt(curr.total_stock) || 0), 0),
				displayTallas: new Set(breakdown.map((s: any) => s.talla)).size
			};
		}).filter((r: any) => {
			const matchesSearch = r.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
				r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(typeof r.marca === 'object' ? r.marca.nombre : r.marca)?.toLowerCase().includes(searchTerm.toLowerCase());

			// Show if matches search AND (has stock in filtered view or no filters applied)
			return matchesSearch && (r.displayStock > 0 || (!selectedBodegaId && !selectedTalla && !searchTerm));
		});
	}, [referencias, searchTerm, selectedBodegaId, selectedTalla, permittedBodegaIds]);

	// Price with discount helper
	const getAdjustedPrice = (price: number, bodegaId: number | null) => {
		if (!bodegaId) return price;
		const access = bodega_accesos?.find((a: any) =>
			factura && a.bodega_id === bodegaId && a.user_id === factura.local?.id
		);
		const discount = Number(access?.descuento || 0);
		return Math.max(0, price - discount);
	};

	const handleQtyChange = (id: string, delta: number, max: number) => {
		setQuantities(prev => {
			const current = prev[id] || 0;
			const next = Math.max(0, Math.min(max, current + delta));
			if (next === 0 && current + delta <= 0) {
				const { [id]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [id]: next };
		});
	};

	const groupedStock = useMemo(() => {
		const groups: Record<string, any> = {};

		allStock.forEach(s => {
			if (s.type === 'muestra') {
				if (!['admin', 'bodega', 'superadmin'].includes(auth.user.role)) return;

				if (!groups['muestras']) {
					groups['muestras'] = {
						id: 'muestras',
						nombre: 'Muestras en Locales',
						total_stock: 0,
						items: [],
						can_order: true,
						is_muestra_group: true
					};
				}
				groups['muestras'].items.push({
					...s,
					key: `m:${s.muestra_id}`,
					precio_ajustado: s.precio_venta // No discount for samples? Or same?
				});
				groups['muestras'].total_stock += 1;
				return;
			}

			if (!permittedBodegaIds.has(s.bodega_id)) return;

			const access = bodega_accesos?.find((a: any) =>
				factura && a.bodega_id === s.bodega_id && a.user_id === factura.local?.id
			);

			if (!access) return;

			if (!groups[s.bodega_id]) {
				groups[s.bodega_id] = {
					id: s.bodega_id,
					nombre: s.bodega_nombre,
					total_stock: 0,
					items: [],
					can_order: !!access.can_order,
					descuento: Number(access.descuento || 0)
				};
			}

			groups[s.bodega_id].total_stock += s.stock;
			const adjustedPrice = Math.max(0, s.precio_venta - groups[s.bodega_id].descuento);

			groups[s.bodega_id].items.push({
				...s,
				key: s.id.toString(),
				precio_ajustado: adjustedPrice
			});
		});
		return Object.values(groups);
	}, [allStock, bodega_accesos, factura, permittedBodegaIds]);

	const canSubmit = Object.keys(quantities).length > 0;
	const submit = async () => {
		const itemsToAdd = Object.entries(quantities).map(([key, qty]) => {
			let invId: number | null = null;
			let muestraId: number | null = null;
			let finalPrice = 0;

			if (key.startsWith('m:')) {
				muestraId = parseInt(key.replace('m:', ''));
				// Find price in muestras group
				const group = groupedStock.find((g: any) => g.is_muestra_group);
				const item = group?.items.find((i: any) => i.muestra_id === muestraId);
				finalPrice = item?.precio_ajustado || 0;
				invId = item?.id;
			} else {
				invId = parseInt(key);
				for (const group of groupedStock) {
					if (group.is_muestra_group) continue;
					const item = group.items.find((i: any) => i.id === invId);
					if (item) {
						finalPrice = item.precio_ajustado;
						break;
					}
				}
			}

			return {
				inventario_id: invId,
				muestra_id: muestraId,
				cantidad: qty,
				precio_unitario: finalPrice
			};
		});

		setSaving(true);
		try {
			const response = await axios.post(`/api/ventas/${factura.id}/detalles`, { items: itemsToAdd });
			if (onAdded) {
				onAdded(response.data.data);
			}
			onClose();
		} catch (error: any) {
			const msg = error.response?.data?.error || 'Error al agregar productos.';
			showAlert('error', msg);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			show={isOpen}
			closeable={true}
			onClose={onClose}
			title={mode === 'search' ? 'Búsqueda por Referencia' : 'Seleccionar Detalle'}
			maxWidth="2xl"
		>
			<form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col h-[700px] overflow-hidden bg-white">
				{/* Header / Search Area */}
				<div className="p-6 border-b bg-white space-y-4">
					{mode === 'search' ? (
						<>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
								<input
									type="text"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Buscar por código, marca o descripción..."
									className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all font-medium text-slate-600"
								/>
							</div>

							<div className="flex gap-2">
								<div className="flex-1 relative">
									<Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
									<select
										value={selectedBodegaId || ''}
										onChange={(e) => setSelectedBodegaId(e.target.value ? parseInt(e.target.value) : null)}
										className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all cursor-pointer"
									>
										<option value="">Todas las bodegas</option>
										{bodegas?.filter((b: any) => permittedBodegaIds.has(b.id)).map((b: any) => (
											<option key={b.id} value={b.id}>{b.nombre}</option>
										))}
									</select>
									<ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-270 text-slate-400 pointer-events-none" />
								</div>
								<div className="flex-1 relative">
									<Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
									<select
										value={selectedTalla || ''}
										onChange={(e) => setSelectedTalla(e.target.value || null)}
										className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all cursor-pointer"
									>
										<option value="">Todas las tallas</option>
										{availableTallas.map((t) => (
											<option key={t} value={t}>Talla {t}</option>
										))}
									</select>
									<ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-270 text-slate-400 pointer-events-none" />
								</div>
							</div>
						</>
					) : (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
									{selectedRef?.foto ? (
										<img src={`/storage/${selectedRef.foto}`} alt="Product" className="h-full w-full object-cover" />
									) : (
										<ImageIcon className="h-6 w-6 text-slate-300" />
									)}
								</div>
								<div className="space-y-0.5">
									<div className="flex items-center gap-2">
										<span className="text-xl font-black text-[#1e293b]">{selectedRef?.codigo}</span>
										<Badge variant="outline" className="text-[#475569] border font-bold h-5 px-2 text-[10px] uppercase">
											{typeof selectedRef?.marca === 'object' ? selectedRef.marca.nombre : (selectedRef?.marca || 'N/A')}
										</Badge>
									</div>
									<h3 className="text-[13px] font-bold text-[#64748b] uppercase tracking-wide">{selectedRef?.descripcion}</h3>
								</div>
							</div>
							<button
								onClick={() => setMode('search')}
								className="text-xs font-bold text-[#64748b] hover:text-slate-900 flex items-center gap-1 transition-colors bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
							>
								← Volver
							</button>
						</div>
					)}
				</div>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto">
					{mode === 'search' ? (
						<div className="divide-y divide-slate-100 p-2">
							{filteredRefs.map((r: any) => (
								<button
									key={r.id}
									onClick={() => handleSelectRef(r)}
									className="cursor-pointer w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group rounded-xl"
								>
									<div className="flex items-center gap-4">
										<div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
											{r.foto ? (
												<img src={`/storage/${r.foto}`} alt="Thumb" className="h-full w-full object-cover" />
											) : (
												<ImageIcon className="h-4 w-4 text-slate-300" />
											)}
										</div>
										<div className="space-y-0.5">
											<div className="flex items-center gap-2">
												<span className="font-bold text-[#1e293b]">{r.codigo}</span>
												<span className="text-[#1e293b] font-medium uppercase truncate max-w-[200px]">{r.descripcion}</span>
											</div>
											<div className="flex gap-1.5 mt-1">
												<Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 rounded-md py-0 px-1.5">
													{typeof r.marca === 'object' ? r.marca.nombre : (r.marca || 'GENERIC')}
												</Badge>
												<Badge variant="secondary" className="text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md py-0 px-1.5">
													{r.displayTallas} tallas
												</Badge>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-6">
										<Badge variant="secondary" className="bg-slate-100 text-[#475569] py-1 px-3 rounded-full flex items-center gap-2 text-[10px] uppercase border-none">
											<Box className="h-3 w-3" />
											{r.displayStock} uds
										</Badge>
										${Number(r.precio_venta || 0).toLocaleString()}
									</div>
								</button>
							))}
							{filteredRefs.length === 0 && (
								<div className="p-12 text-center text-slate-400">
									<Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
									<p className="text-sm italic">No se encontraron referencias disponibles.</p>
								</div>
							)}
						</div>
					) : (
						<div className="p-6 space-y-6">

							{loadingStock ? (
								<div className="space-y-3">
									{[1, 2].map(i => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl" />)}
								</div>
							) : (
								<div className="space-y-4">
									{groupedStock.map((bodega) => (
										<div key={bodega.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
											<div className="bg-[#f8fafc] px-4 py-2 border-b flex items-center justify-between">
												<div className="flex items-center gap-2 text-[#1e293b]">
													<Warehouse className="h-3.5 w-3.5 text-slate-400" />
													<span className="text-[11px] uppercase font-bold tracking-widest">{bodega.nombre}</span>
												</div>
												<span className="text-[11px] text-slate-400">
													{bodega.total_stock} uds disponibles
												</span>
											</div>
											<div className="divide-y divide-slate-100">
												{bodega.items.map((item: any) => {
													const qty = quantities[item.key] || 0;
													return (
														<div key={item.key} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
															<div className="flex items-center gap-6">
																<div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white">
																	<span className="text-slate-900 text-xs font-bold">{item.talla}</span>
																</div>
																<div className="space-y-0.5">
																	<div className="flex items-center gap-2">
																		<span className="text-sm font-bold text-slate-700">
																		{item.is_muestra ? item.bodega_nombre : 'Stock en Bodega'}
																		</span>
																		{item.etiquetas && (
																			<div className="flex gap-1">
																				{item.etiquetas.map((t: string) => (
																					<Badge key={t} variant="outline" className="text-[9px] py-0 border-slate-200">
																						{t}
																					</Badge>
																				))}
																			</div>
																		)}
																	</div>
																	<div className="flex items-center gap-2 text-[11px] text-slate-500 tracking-tight">
																		<span>{item.stock} disp.</span>
																		<span className="text-slate-900 border-l border-slate-200 pl-2 ml-1">
																			${Number(item.precio_ajustado || 0).toLocaleString()}
																		</span>
																	</div>
																</div>
															</div>
															{bodega.can_order && (
																<div className="flex items-center gap-3 bg-white border border-slate-100 p-1.5 rounded-xl shadow-xs">
																	<button
																		type="button"
																		onClick={() => handleQtyChange(item.key, -1, item.stock)}
																		className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all active:scale-95"
																	>
																		<Minus className="h-4 w-4" />
																	</button>
																	<div className="w-6 text-center text-slate-900 text-sm font-medium">
																		{qty}
																	</div>
																	<button
																		type="button"
																		onClick={() => handleQtyChange(item.key, 1, item.stock)}
																		className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-900 transition-all active:scale-95 shadow-sm"
																	>
																		<Plus className="h-4 w-4" />
																	</button>
																</div>
															)}
														</div>
													);
												})}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer Bar */}
				<div className="p-6 bg-white border-t">
					{mode === 'detail' ? (
						<FormButtons
							processing={saving}
							reset={onClose}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Agregar a factura' }}
							submitDisabled={!canSubmit}
						/>
					) : (
						<div className="flex justify-end">
							<button
								type="button"
								onClick={onClose}
								className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
							>
								Cerrar
							</button>
						</div>
					)}
				</div>
			</form>
		</Modal>
	);
};
