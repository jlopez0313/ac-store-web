import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Layers, Package, Plus } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

type AddDetailForm = {
	referencia_id: number | '';
	bodega_id: number | '';
	modo: 'cajas' | 'tallado';
	numero_cajas: number | '';
	pares_por_caja: number | '';
	precio_unitario: number | '';
};

export const AddDetailModal = ({ isOpen, onClose, referencia, factura, bodegas, onAdded }: any) => {
	const [addMode, setAddMode] = useState<'simple' | 'sized'>('simple');
	const [simpleBoxes, setSimpleBoxes] = useState('1');
	const [simplePairsPerBox, setSimplePairsPerBox] = useState('24');
	const [simplePrice, setSimplePrice] = useState('');
	const [simpleSellingPrice, setSimpleSellingPrice] = useState('');
	const [simpleWarehouse, setSimpleWarehouse] = useState('');

	const [sizedPrice, setSizedPrice] = useState('');
	const [sizedSellingPrice, setSizedSellingPrice] = useState('');
	const [sizedWarehouse, setSizedWarehouse] = useState('');
	const [sizedShelf, setSizedShelf] = useState('');

	const [sizedRows, setSizedRows] = useState<{ size: string, qty: string }[]>([]);

	const updateSizedRow = (index: number, field: string, value: string) => {
		const newRows = [...sizedRows];
		newRows[index] = { ...newRows[index], [field]: value };
		setSizedRows(newRows);
	};

	const sizedTotal = sizedRows.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0);


	useEffect(() => {
		if (isOpen && referencia) {
			setSimplePrice('');
			setSimpleSellingPrice('');
			setSizedPrice('');
			setSizedSellingPrice('');
			setSizedWarehouse('');
			setSizedShelf('');

			let initialRows: { size: string, qty: string }[] = [];
			const jsonStr = referencia.categoria?.variaciones_json;
			if (jsonStr) {
				try {
					const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
					if (Array.isArray(parsed)) {
						initialRows = parsed.map((item: any) => {
							let sizeLabel = String(item);
							if (typeof item === 'object' && item !== null) {
								sizeLabel = String(item.text || item.nombre || item.talla || item.valor || Object.values(item)[0] || JSON.stringify(item));
							}
							return { size: sizeLabel, qty: '' };
						});
					}
				} catch (e) {
					console.error("Error parsing variaciones_json", e);
				}
			}

			if (initialRows.length === 0) {
				initialRows = Array.from({ length: 15 }, (_, i) => ({ size: String(34 + i), qty: '' }));
			}

			setSizedRows(initialRows);
		}
	}, [isOpen, referencia]);

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();
		try {
			let payload: any;
			if (addMode === 'simple') {
				const totalPares = (parseInt(simpleBoxes) || 0) * (parseInt(simplePairsPerBox) || 0);
				payload = {
					referencia_id: referencia.id,
					bodega_id: simpleWarehouse,
					modo: 'cajas',
					numero_cajas: simpleBoxes,
					pares_por_caja: simplePairsPerBox,
					cantidad: totalPares,
					precio_unitario: simplePrice,
					precio_venta: simpleSellingPrice
				};
			} else {
				payload = {
					referencia_id: referencia.id,
					bodega_id: sizedWarehouse,
					modo: 'tallado',
					tallas: sizedRows
						.filter(r => (parseInt(r.qty) || 0) > 0)
						.map(r => ({ ...r, estanteria_id: sizedShelf })),
					cantidad: sizedTotal,
					precio_unitario: sizedPrice,
					precio_venta: sizedSellingPrice
				};
			}

			const response = await axios.post(`/api/compras/${factura.id}/detalles`, payload);

			if (onAdded) {
				onAdded(response.data.data);
			}
			onClose();
		} catch (error) {
			console.error('Error guardando detalle:', error);
			showAlert('error', 'Error guardando el ítem. Verifica los datos.');
		}
	};

	if (!referencia || !factura) return null;

	return (
		<Modal
			show={isOpen}
			closeable={true}
			onClose={onClose}
			title={`Agregar artículo a factura #${factura.id}`}
			subtitle={`${referencia.codigo} — ${referencia.descripcion} (${referencia.categoria?.nombre})`}
			maxWidth="2xl"
			className={cn(
				"flex flex-col",
				addMode === 'simple' ? "h-[60vh]" : "h-[90vh]"
			)}
		>
			<form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
				<div className="px-6 pb-6 flex-1 overflow-y-auto mt-4 flex flex-col">
					<Tabs value={addMode} onValueChange={v => setAddMode(v as 'simple' | 'sized')} className="flex-1 flex flex-col">
						<TabsList className="w-full">
							<TabsTrigger value="simple" className="flex-1 gap-2">
								<Package className="h-4 w-4" /> Por cajas (sin tallar)
							</TabsTrigger>
							<TabsTrigger value="sized" className="flex-1 gap-2">
								<Layers className="h-4 w-4" /> Tallado directo
							</TabsTrigger>
						</TabsList>

						{/* ── Simple mode ── */}
						<TabsContent value="simple" className="space-y-3 pt-2">
							<p className="text-xs text-muted-foreground">
								Registra cuántas cajas compraste y cuántos pares hay en cada una. El stock queda en la bodega destino y podrás tallar luego desde el módulo de Cajas.
							</p>
							<div className="grid grid-cols-2 gap-3">
								<InputField
									name="simpleBoxes"
									title="Número de cajas"
									type="number"
									min="1"
									value={simpleBoxes}
									onChange={(v: string) => setSimpleBoxes(v)}
								/>
								<InputField
									name="simplePairsPerBox"
									title="Unidades por caja"
									type="number"
									min="1"
									value={simplePairsPerBox}
									onChange={(v: string) => setSimplePairsPerBox(v)}
								/>
							</div>
							<div className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-center">
								Total: {(parseInt(simpleBoxes) || 0) * (parseInt(simplePairsPerBox) || 0)} pares
							</div>
							<div className="grid grid-cols-3 gap-3">
								<InputField
									name="simplePrice"
									title="Precio unit. (Costo)"
									type="number"
									min="0"
									value={simplePrice}
									onChange={(v: string) => setSimplePrice(v)}
								/>
								<InputField
									name="simpleSellingPrice"
									title="Precio de venta"
									type="number"
									min="0"
									value={simpleSellingPrice}
									onChange={(v: string) => setSimpleSellingPrice(v)}
								/>
								<SelectField
									item={{ idx: 'id', value: 'nombre' }}
									name="simpleWarehouse"
									title="Bodega destino"
									lista={bodegas}
									value={simpleWarehouse}
									onChange={(v) => setSimpleWarehouse(v as string)}
									error={""}
								/>

							</div>
						</TabsContent>
						<TabsContent value="sized" className="space-y-3 pt-2 flex-1 flex flex-col min-h-0">
							<p className="text-xs text-muted-foreground flex-shrink-0">
								Ingresa la cantidad por talla. Los pares quedarán asignados directamente al estante de la bodega seleccionada.
							</p>
							<div className="grid grid-cols-2 gap-3 flex-shrink-0">
								<InputField
									name="sizedPrice"
									title="Precio (Costo)"
									type="number"
									min="0"
									value={sizedPrice}
									onChange={(v: string) => setSizedPrice(v)}
								/>
								<InputField
									name="sizedSellingPrice"
									title="Precio Venta"
									type="number"
									min="0"
									value={sizedSellingPrice}
									onChange={(v: string) => setSizedSellingPrice(v)}
								/>
								<SelectField
									item={{ idx: 'id', value: 'nombre' }}
									name="sizedWarehouse"
									title="Bodega"
									lista={bodegas}
									value={sizedWarehouse}
									onChange={(v) => {
										setSizedWarehouse(v as string);
										setSizedShelf('');
									}}
									error={""}
								/>
								<SelectField
									item={{ idx: 'id', value: 'nombre' }}
									name="sizedShelf"
									title="Estantería"
									lista={bodegas.find((b: any) => String(b.id) === String(sizedWarehouse))?.estanterias || []}
									value={sizedShelf}
									onChange={(v) => setSizedShelf(v as string)}
									error={""}
									disabled={!sizedWarehouse}
								/>
							</div>

							{/* Grid de tallas compacto */}
							<div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-[200px] max-w-sm mx-auto w-full">
								<div className="bg-muted/50 px-4 py-2 text-xs font-bold tracking-wider text-muted-foreground border-b grid grid-cols-[1fr_80px] gap-4 flex-shrink-0">
									<span>Variación</span>
									<span className="text-center">Cant.</span>
								</div>
								<div className="flex-1 overflow-y-auto bg-background">
									<div className="grid grid-cols-1 divide-y border-border px-2">
										{sizedRows.map((row, i) => (
											<div key={row.size} className="grid grid-cols-[1fr_80px] gap-4 items-center py-2 px-2 hover:bg-muted/50 transition-colors">
												<span className="font-bold text-sm text-foreground ml-2">{row.size}</span>

												<div className="-mt-1">
													<InputField
														name={`qty_${i}`}
														title=""
														type="number"
														min="0"
														value={row.qty}
														onChange={v => updateSizedRow(i, 'qty', v)}
														placeholder="0"
														className="h-7 text-sm text-right px-2 mt-0"
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>

							<div className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-center">
								Total Unidades talladas: <span className="font-bold text-primary">{sizedTotal}</span>
							</div>
						</TabsContent>
					</Tabs>
				</div>
				<div className="px-6 py-4 bg-muted/30 border-t flex justify-end gap-3 flex-shrink-0">
					<button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium bg-background hover:bg-muted text-foreground">
						Cancelar
					</button>
					<button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center">
						<Plus className="w-4 h-4 mr-2" />
						Agregar a factura
					</button>
				</div>
			</form>
		</Modal>
	);
};
