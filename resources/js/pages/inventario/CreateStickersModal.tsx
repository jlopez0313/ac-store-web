import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Printer, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface CreateStickersModalProps {
	isOpen: boolean;
	onClose: () => void;
	referencia: any;
	bodegas: any[];
	initialShelf?: any;
}

export const CreateStickersModal: React.FC<CreateStickersModalProps> = ({ isOpen, onClose, referencia, bodegas, initialShelf }) => {
	const [targetWarehouse, setTargetWarehouse] = useState('');
	const [targetShelf, setTargetShelf] = useState('');
	const [sizedRows, setSizedRows] = useState<{ size: string, qty: string }[]>([]);
	const [viewerImage, setViewerImage] = useState<string | null>(null);
	const viewerOpenRef = useRef(false);
	const [processing, setProcessing] = useState(false);

	const filteredBodegas = referencia ? bodegas.filter((b: any) => b.cuenta_id === referencia.cuenta_id) : [];

	useEffect(() => {
		if (isOpen && initialShelf) {
			setTargetWarehouse(String(initialShelf.bodega_id));
			setTargetShelf(String(initialShelf.id));
		}
	}, [isOpen, initialShelf]);

	useEffect(() => {
		if (isOpen && filteredBodegas.length === 1 && !targetWarehouse) {
			setTargetWarehouse(String(filteredBodegas[0].id));
		}
	}, [isOpen, filteredBodegas, targetWarehouse]);

	useEffect(() => {
		if (isOpen && referencia) {
			let initialRows: { size: string, qty: string }[] = [];
			const jsonStr = referencia.categoria?.variaciones_json;

			if (jsonStr) {
				try {
					const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
					if (Array.isArray(parsed)) {
						initialRows = parsed.map((item: any) => {
							let sizeLabel = String(item);
							if (typeof item === 'object' && item !== null) {
								sizeLabel = String(item.text || item.nombre || item.talla || item.valor || Object.values(item)[0]);
							}
							return { size: sizeLabel, qty: '' };
						});
					}
				} catch (e) {
					console.error("Error parsing variations", e);
				}
			}

			if (initialRows.length === 0) {
				// Fallback to numeric sizes if no variations
				initialRows = Array.from({ length: 15 }, (_, i) => ({ size: String(34 + i), qty: '' }));
			}
			setSizedRows(initialRows);
		}
	}, [isOpen, referencia]);

	if (!referencia) return null;

	const updateSizedRow = (index: number, field: string, value: string) => {
		const newRows = [...sizedRows];
		newRows[index] = { ...newRows[index], [field]: value };
		setSizedRows(newRows);
	};

	const totalQty = sizedRows.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0);

	const openViewer = (image: string) => {
		viewerOpenRef.current = true;
		setViewerImage(image);
	};

	const closeViewer = () => {
		viewerOpenRef.current = false;
		setViewerImage(null);
	};

	const handleModalClose = () => {
		if (!viewerOpenRef.current) onClose();
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (totalQty === 0) {
			showAlert('warning', 'Debes ingresar al menos una cantidad.');
			return;
		}

		if (!targetShelf) {
			showAlert('warning', 'Debes seleccionar una ubicación (estantería).');
			return;
		}

		setProcessing(true);
		try {
			await axios.post(route('api.stickers.store'), {
				referencia_id: referencia.id,
				estanteria_id: targetShelf,
				tallas: sizedRows.filter(r => (parseInt(r.qty) || 0) > 0).map(r => ({ talla: r.size, qty: parseInt(r.qty) }))
			});
			showAlert('success', 'Solicitud de etiquetas enviada correctamente.');
			onClose();
		} catch (error: any) {
			console.error('Error creating sticker request:', error);
			showAlert('error', error.response?.data?.message || 'Error al crear la solicitud de etiquetas.');
		} finally {
			setProcessing(false);
		}
	};

	const currentBodega = filteredBodegas.find((b: any) => String(b.id) === String(targetWarehouse));
	const shelves = useMemo(() => {
		const list = currentBodega?.estanterias || [];
		return [...list].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true, sensitivity: 'base' }));
	}, [currentBodega]);

	return (
		<Modal
			show={isOpen}
			onClose={handleModalClose}
			closeable={true}
			title={`Crear Stickers: ${referencia.codigo}`}
			maxWidth="2xl"
		>
			<form onSubmit={submit} className="flex flex-col h-[80vh]">
				<div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
					<div className="flex flex-col sm:grid sm:grid-cols-[120px_1fr] gap-4 sm:gap-6 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
						<div
							className="flex h-[120px] w-[120px] mx-auto sm:mx-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shrink-0"
							onClick={() => referencia.foto && openViewer(referencia.foto)}
						>
							{referencia.foto ? (
								<img src={referencia.foto} alt="" className="h-full w-full object-cover" />
							) : (
								<div className="text-center text-[10px] text-slate-400">Sin foto</div>
							)}
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
									{referencia.descripcion}
								</span>
								<Badge variant="outline" className="font-mono shrink-0">
									SKU: {referencia.codigo}
								</Badge>
							</div>
							<div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
								{initialShelf ? (
									<div className="flex flex-col gap-1 py-1">
										<p className="text-[10px] uppercase font-bold text-slate-400">Ubicación de impresión</p>
										<div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
											<Warehouse className="h-4 w-4" />
											<span className="font-bold text-sm">
												{initialShelf.bodega_nombre} — {initialShelf.nombre}
											</span>
										</div>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<SelectField
											item={{ idx: 'id', value: 'nombre' }}
											name="targetWarehouse"
											title="Bodega"
											lista={filteredBodegas}
											value={targetWarehouse}
											onChange={(v) => {
												setTargetWarehouse(v as string);
												setTargetShelf('');
											}}
											error={""}
											placeholder="Seleccionar..."
										/>
										<SelectField
											item={{ idx: 'id', value: 'nombre' }}
											name="targetShelf"
											title="Estantería"
											lista={shelves}
											value={targetShelf}
											onChange={(v) => setTargetShelf(v as string)}
											error={""}
											placeholder="Seleccionar..."
											disabled={!targetWarehouse}
										/>
									</div>
								)}
							</div>
						</div>
					</div>

					<p className="text-xs text-muted-foreground text-center">
						Ingresa la cantidad de etiquetas que necesitas imprimir para cada talla en la ubicación seleccionada.
					</p>

					<div className="border dark:border-slate-800 rounded-lg overflow-hidden flex flex-col max-w-md mx-auto w-full shadow-sm">
						<div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border-b dark:border-slate-700 grid grid-cols-[1fr_80px] gap-4 uppercase tracking-wider">
							<span>Talla</span>
							<span className="text-right">Etiquetas</span>
						</div>
						<div className="divide-y dark:divide-slate-800 max-h-[300px] overflow-y-auto">
							{sizedRows.map((row, i) => (
								<div key={row.size} className="px-4 py-2 grid grid-cols-[1fr_80px] gap-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
									<span className="font-mono font-bold text-slate-700 dark:text-slate-200">{row.size}</span>
									<InputField
										name={`qty_${i}`}
										title=""
										type="number"
										min="0"
										value={row.qty}
										onChange={v => updateSizedRow(i, 'qty', v)}
										placeholder="0"
										className="text-right h-9"
									/>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="p-4 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex items-center justify-between">
					<div>
						<p className="text-[10px] uppercase font-bold text-slate-400">Total etiquetas</p>
						<p className="text-lg font-bold text-slate-900 dark:text-slate-100">
							{totalQty} stickers
						</p>
					</div>
					<div className="flex gap-3">
						<Button type="button" variant="outline" onClick={onClose} disabled={processing}>Cancelar</Button>
						<Button type="submit" className="gap-2" disabled={processing || totalQty === 0 || !targetShelf}>
							{!processing && <Printer className="h-4 w-4" />}
							{processing ? 'Generando...' : 'Solicitar Etiquetas'}
						</Button>
					</div>
				</div>
			</form>
			<ViewerModal
				show={!!viewerImage}
				image={viewerImage}
				onClose={closeViewer}
			/>
		</Modal>
	);
};
