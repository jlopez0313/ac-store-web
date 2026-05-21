import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { showAlert } from '@/plugins/sweetalert';
import { router } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export const TallarCajaModal = ({ isOpen, onClose, caja, bodegas, onSuccess }: any) => {
	const [sizedWarehouse, setSizedWarehouse] = useState('');
	const [sizedShelf, setSizedShelf] = useState('');
	const [sizedRows, setSizedRows] = useState<{ size: string, qty: string }[]>([]);
	const [viewerImage, setViewerImage] = useState<string | null>(null);
	const viewerOpenRef = useRef(false);

	useEffect(() => {
		if (isOpen && caja) {
			setSizedWarehouse(caja.bodega_id?.toString() || '');

			let initialRows: { size: string, qty: string }[] = [];
			const variaciones = caja.referencia_variaciones;

			if (Array.isArray(variaciones) && variaciones.length > 0) {
				initialRows = variaciones.map((item: any) => {
					let sizeLabel = String(item);
					if (typeof item === 'object' && item !== null) {
						sizeLabel = String(item.text || item.nombre || item.talla || item.valor || Object.values(item)[0]);
					}
					return { size: sizeLabel, qty: '' };
				});
			} else {
				initialRows = Array.from({ length: 15 }, (_, i) => ({ size: String(34 + i), qty: '' }));
			}
			setSizedRows(initialRows);
		}
	}, [isOpen, caja]);

	const [processing, setProcessing] = useState(false);

	const updateSizedRow = (index: number, field: string, value: string) => {
		const newRows = [...sizedRows];
		newRows[index] = { ...newRows[index], [field]: value };
		setSizedRows(newRows);
	};

	const sizedTotal = sizedRows.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0);

	const openViewer = (image: string) => {
		viewerOpenRef.current = true;
		setViewerImage(image);
	};

	const closeViewer = () => {
		viewerOpenRef.current = false;
		setViewerImage(null);
	};

	const handleModalClose = () => {
		if (!viewerOpenRef.current) {
			onClose();
		}
	};

	const submit = (e: React.FormEvent) => {
		e.preventDefault();

		if (sizedTotal === 0) {
			showAlert('warning', 'Debes ingresar al menos una cantidad para tallar.');
			return;
		}

		if (sizedTotal > caja.cantidad) {
			showAlert('error', `La cantidad total (${sizedTotal}) no puede superar el disponible en caja (${caja.cantidad}).`);
			return;
		}

		const tallasValidas = sizedRows.filter(r => (parseInt(r.qty) || 0) > 0);
		if (!sizedShelf) {
			showAlert('warning', 'Debes seleccionar una estantería de destino.');
			return;
		}

		setProcessing(true);
		router.post(route('cajas.tallar', { caja: caja.id }), {
			estanteria_id: sizedShelf,
			tallas: tallasValidas
		}, {
			onSuccess: () => {
				showAlert('success', 'Producto tallado e ingresado al inventario.');
				if (onSuccess) onSuccess();
				onClose();
			},
			onError: (err: any) => {
				showAlert('error', err.error || 'Ocurrió un error al procesar el tallado.');
			},
			onFinish: () => setProcessing(false)
		});
	};

	if (!caja) return null;

	const currentBodega = bodegas.find((b: any) => String(b.id) === String(sizedWarehouse));
	const shelves = useMemo(() => {
		const list = currentBodega?.estanterias || [];
		return [...list].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true, sensitivity: 'base' }));
	}, [currentBodega]);

	return (
		<Modal
			show={isOpen}
			onClose={handleModalClose}
			closeable={true}
			title={`Tallar Caja #${caja?.referencia_codigo}`}
			maxWidth="2xl"
		>
			<form onSubmit={submit} className="flex flex-col h-[80vh]">
				<div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
					<div className="flex flex-col sm:grid sm:grid-cols-[120px_1fr] gap-4 sm:gap-6 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
						<div
							className="flex h-[120px] w-[120px] mx-auto sm:mx-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shrink-0"
							onClick={() => caja?.referencia_foto && openViewer(caja.referencia_foto)}
						>
							{caja?.referencia_foto ? (
								<img src={`/storage/${caja.referencia_foto}`} alt="" className="h-full w-full object-cover" />
							) : (
								<div className="text-center text-[10px] text-slate-400">Sin foto</div>
							)}
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{caja.referencia_descripcion}</span>
								<Badge variant="outline" className="font-mono">
									SKU: {caja.referencia_codigo}
								</Badge>
							</div>
							<div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
								<div className="mb-4 flex items-center justify-between">
									<div>
										<p className="text-[10px] uppercase font-medium text-slate-400">Saldo en caja</p>
										<p className={`text-xl font-bold ${caja.cantidad - sizedTotal < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
											{caja.cantidad - sizedTotal} pares
										</p>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<SelectField
										item={{ idx: 'id', value: 'nombre' }}
										name="sizedWarehouse"
										title="Bodega de destino"
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
										lista={shelves}
										value={sizedShelf}
										onChange={(v) => setSizedShelf(v as string)}
										error={""}
										placeholder="Seleccionar estante..."
										disabled={!sizedWarehouse}
									/>
								</div>
							</div>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Ingresa la cantidad por talla y selecciona el estante donde guardarás el stock físico.
					</p>

					<div className="border dark:border-slate-800 rounded-lg overflow-hidden flex flex-col mx-auto w-full">
						<div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border-b dark:border-slate-700 grid grid-cols-[1fr_80px] gap-4">
							<span>Talla</span>
							<span className="text-right">Cantidad</span>
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
						<p className="text-[10px] uppercase font-bold text-slate-400">Total a tallar</p>
						<p className={`text-lg font-bold ${sizedTotal > caja.cantidad ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
							{sizedTotal} / {caja.cantidad} pares
						</p>
					</div>
					<div className="flex gap-3">
						<Button type="button" variant="outline" onClick={onClose} disabled={processing}>Cancelar</Button>
						<Button type="submit" className="gap-2" disabled={processing || sizedTotal === 0 || sizedTotal > caja.cantidad}>
							{!processing && <Save className="h-4 w-4" />}
							{processing ? 'Procesando...' : 'Confirmar Tallado'}
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
