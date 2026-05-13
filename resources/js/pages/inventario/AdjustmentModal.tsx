import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { showAlert } from '@/plugins/sweetalert';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Image as ImageIcon, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdjustmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	referencia: any;
	estanteria: {
		id: number;
		nombre: string;
		bodega_id: number;
		bodega_nombre: string;
	};
	bodegas: any[];
	items: any[]; // Sizes and current stocks for this shelf
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ isOpen, onClose, onSuccess, referencia, estanteria, bodegas, items }) => {
	const { auth } = usePage<SharedData>().props;
	const isBodega = auth.user?.role === 'bodega';

	const [form, setForm] = useState({
		precio_compra: 0,
		precio_venta: 0,
		observacion: '',
		detalles: [] as { talla: string; stock: number; original_stock: number }[],
		nueva_bodega_id: '' as string | number,
		nueva_estanteria_id: '' as string | number,
	});
	const [loading, setLoading] = useState(false);
	const [viewerImage, setViewerImage] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen && referencia) {
			let initialDetails: { talla: string; stock: number }[] = [];
			const jsonStr = referencia.categoria?.variaciones_json;
			const categorySizes = new Set<string>();

			// 1. Get sizes from category variations
			if (jsonStr) {
				try {
					const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
					if (Array.isArray(parsed)) {
						parsed.forEach((item: any) => {
							let sizeLabel = String(item);
							if (typeof item === 'object' && item !== null) {
								sizeLabel = String(item.text || item.nombre || item.talla || item.valor || Object.values(item)[0] || JSON.stringify(item));
							}
							categorySizes.add(sizeLabel);
						});
					}
				} catch (e) {
					console.error("Error parsing variations", e);
				}
			}

			// 2. Prioritize items that ALREADY exist in stock (even if not in category)
			items.forEach(item => {
				initialDetails.push({
					talla: String(item.talla),
					stock: Number(item.stock),
					original_stock: Number(item.stock)
				});
				categorySizes.delete(String(item.talla)); // Avoid duplicates
			});

			// 3. Add remaining category sizes with 0 stock
			categorySizes.forEach(sizeLabel => {
				initialDetails.push({
					talla: sizeLabel,
					stock: 0,
					original_stock: 0
				});
			});

			setForm({
				precio_compra: items[0]?.precio_compra || referencia.precio_compra || 0,
				precio_venta: items[0]?.precio_venta || referencia.precio_venta || 0,
				observacion: '',
				detalles: initialDetails,
				nueva_bodega_id: String(estanteria.bodega_id),
				nueva_estanteria_id: String(estanteria.id),
			});
			console.log("Form initialized with strings:", {
				bodega: String(estanteria.bodega_id),
				estanteria: String(estanteria.id),
				details_count: initialDetails.length
			});
			console.log("Details initialized:", initialDetails);
		}
	}, [isOpen, items, referencia, estanteria]);

	const currentBodega = bodegas.find(b => b.id == form.nueva_bodega_id);
	const availableShelves = currentBodega?.estanterias || [];

	const handleStockChange = (talla: string, value: string) => {
		const newStock = parseInt(value) || 0;
		setForm((prev) => ({
			...prev,
			detalles: prev.detalles.map((d) => (d.talla === talla ? { ...d, stock: newStock } : d)),
		}));
	};

	const hasErrors = isBodega && form.detalles.some(d => d.stock < d.original_stock);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (hasErrors) return;

		setLoading(true);
		try {
			await axios.post(route('api.inventario.ajustar'), {
				referencia_id: referencia.id,
				estanteria_id: estanteria.id,
				nueva_estanteria_id: form.nueva_estanteria_id,
				precio_compra: form.precio_compra,
				precio_venta: form.precio_venta,
				observacion: form.observacion,
				detalles: form.detalles,
			});
			showAlert('success', 'Inventario ajustado correctamente');
			onSuccess();
			onClose();
		} catch (error: any) {
			console.error('Error adjusting inventory:', error);
			showAlert('error', error.response?.data?.error || error.response?.data?.message || 'No se pudo ajustar el inventario');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Modal show={isOpen} onClose={onClose} title="Ajustar Inventario" maxWidth="3xl" closeable={true}>
				<form onSubmit={handleSubmit} className="space-y-6 p-6">
					<div className="bg-muted/30 border-border space-y-3 rounded-md border p-4">
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between border-b border-border/50 pb-2">
								<div className="flex items-center gap-2">
									<div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white uppercase">
										{auth.user?.name?.charAt(0)}
									</div>
									<div className="flex flex-col">
										<span className="text-xs font-bold leading-none">{auth.user?.name}</span>
										<span className="text-[10px] text-muted-foreground capitalize">{auth.user?.role}</span>
									</div>
								</div>
								<Badge variant="outline" className="text-[10px] uppercase font-mono bg-white">
									ID: {auth.user?.id}
								</Badge>
							</div>

							<div className="flex gap-4 items-start">
								<button
									type="button"
									onClick={() => referencia.foto && setViewerImage(referencia.foto)}
									className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white transition-transform hover:scale-105 active:scale-95"
								>
									{referencia.foto ? (
										<img src={referencia.foto} alt={referencia.codigo} className="h-full w-full object-cover" />
									) : (
										<ImageIcon className="h-8 w-8 text-slate-300" />
									)}
								</button>
								<div className="flex-1 space-y-1">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Producto</span>
										<span className="font-semibold text-right">
											{referencia.codigo}
										</span>
									</div>
									<p className="text-sm font-medium">{referencia.descripcion}</p>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pt-2 border-t border-border/50">
										<SelectField
											name="nueva_bodega_id"
											title="Bodega"
											value={form.nueva_bodega_id}
											lista={bodegas}
											item={{ idx: 'id', value: 'nombre' }}
											onChange={(val: any) => setForm({ ...form, nueva_bodega_id: val, nueva_estanteria_id: '' })}
											error={undefined}
										/>
										<SelectField
											name="nueva_estanteria_id"
											title="Estantería"
											value={form.nueva_estanteria_id}
											lista={availableShelves}
											item={{ idx: 'id', value: 'nombre' }}
											onChange={(val: any) => setForm({ ...form, nueva_estanteria_id: val })}
											disabled={!form.nueva_bodega_id}
											error={undefined}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="precio_compra">Precio de Compra</Label>
							<Input
								id="precio_compra"
								type="number"
								value={form.precio_compra}
								onChange={(e) => setForm({ ...form, precio_compra: e.target.value === '' ? 0 : Number(e.target.value) })}
								onWheel={(e) => e.currentTarget.blur()}
								placeholder="0"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="precio_venta">Precio de Venta</Label>
							<Input
								id="precio_venta"
								type="number"
								value={form.precio_venta}
								onChange={(e) => setForm({ ...form, precio_venta: e.target.value === '' ? 0 : Number(e.target.value) })}
								onWheel={(e) => e.currentTarget.blur()}
								placeholder="0"
								required
							/>
						</div>
					</div>

					<div className="border-border overflow-hidden rounded-md border">
						<Table>
							<TableHeader className="bg-muted/50">
								<TableRow>
									<TableHead className="text-center">Talla</TableHead>
									<TableHead className="text-center">Cantidad Actual</TableHead>
									<TableHead className="w-40 text-center">Nueva Cantidad</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{form.detalles.map((det) => {
									const isInvalid = isBodega && det.stock < det.original_stock;
									return (
										<TableRow key={det.talla} className={isInvalid ? 'bg-red-50' : ''}>
											<TableCell className="text-center font-bold">{det.talla}</TableCell>
											<TableCell className="text-center text-muted-foreground">{det.original_stock}</TableCell>
											<TableCell>
												<div className="flex flex-col gap-1">
													<Input
														type="number"
														className={`text-center ${isInvalid ? 'border-red-500 ring-red-500' : isBodega ? 'bg-slate-50' : ''}`}
														value={det.stock}
														onChange={(e) => handleStockChange(det.talla, e.target.value)}
														onWheel={(e) => e.currentTarget.blur()}
														min="0"
														required
													/>
													{isInvalid && (
														<span className="text-[10px] text-red-600 font-medium leading-none">
															No puedes disminuir stock
														</span>
													)}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					<div className="space-y-2">
						<Label htmlFor="observacion">Observación / Motivo del Ajuste</Label>
						<Textarea
							id="observacion"
							placeholder="Escriba aquí el motivo del ajuste..."
							value={form.observacion}
							onChange={(e) => setForm({ ...form, observacion: e.target.value })}
							required
						/>
					</div>

					<div className="flex justify-end gap-3 border-t pt-4">
						<Button type="button" variant="outline" onClick={onClose} disabled={loading}>
							Cancelar
						</Button>
						<Button type="submit" loading={loading} disabled={hasErrors} className="gap-2">
							<Save className="h-4 w-4" />
							Guardar Ajuste
						</Button>
					</div>
				</form>
			</Modal>

			<ViewerModal
				show={!!viewerImage}
				image={viewerImage}
				onClose={() => setViewerImage(null)}
			/>
		</>
	);
};
