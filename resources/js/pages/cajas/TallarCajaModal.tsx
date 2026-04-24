import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { showAlert } from '@/plugins/sweetalert';
import { router } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const TallarCajaModal = ({ isOpen, onClose, caja, bodegas }: any) => {
	const [sizedWarehouse, setSizedWarehouse] = useState('');
	const [sizedRows, setSizedRows] = useState<{ size: string, qty: string, estanteria_id: string }[]>([]);
	const [viewerImage, setViewerImage] = useState<string | null>(null);
	const viewerOpenRef = useRef(false);

	useEffect(() => {
		if (isOpen && caja) {
			setSizedWarehouse(caja.bodega_id?.toString() || '');

			let initialRows: { size: string, qty: string, estanteria_id: string }[] = [];
			const variaciones = caja.referencia_variaciones;

			if (Array.isArray(variaciones) && variaciones.length > 0) {
				initialRows = variaciones.map((item: any) => {
					let sizeLabel = String(item);
					if (typeof item === 'object' && item !== null) {
						sizeLabel = String(item.text || item.nombre || item.talla || item.valor || Object.values(item)[0]);
					}
					return { size: sizeLabel, qty: '', estanteria_id: '' };
				});
			} else {
				initialRows = Array.from({ length: 15 }, (_, i) => ({ size: String(34 + i), qty: '', estanteria_id: '' }));
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
		if (tallasValidas.some(r => !r.estanteria_id)) {
			showAlert('warning', 'Debes seleccionar una estantería para cada talla con cantidad.');
			return;
		}

		setProcessing(true);
		router.post(route('cajas.tallar', { caja: caja.id }), {
			tallas: tallasValidas
		}, {
			onSuccess: () => {
				showAlert('success', 'Producto tallado e ingresado al inventario.');
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
	const shelves = currentBodega?.estanterias || [];

	return (
		<Modal
			show={isOpen}
			onClose={handleModalClose}
			closeable={true}
			title={`Tallar Caja #${caja?.referencia_codigo}`}
			maxWidth="2xl"
		>
			<form onSubmit={submit} className="flex flex-col h-[80vh]">
				<div className="p-6 flex-1 overflow-y-auto space-y-4">
					<div className="grid grid-cols-[120px_1fr] gap-6 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
						<div 
							className="flex h-[120px] w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
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
								<span className="text-sm font-semibold text-slate-700">{caja.referencia_descripcion}</span>
								<Badge variant="outline" className="font-mono">
									SKU: {caja.referencia_codigo}
								</Badge>
							</div>
							<div className="bg-white p-4 rounded-lg flex items-center justify-between border border-slate-100">
								<div>
									<p className="text-[10px] uppercase font-bold text-slate-400">Disponible en caja</p>
									<p className="text-xl font-black text-slate-900">{caja.cantidad} pares</p>
								</div>
								<div className="w-64">
									<SelectField
										item={{ idx: 'id', value: 'nombre' }}
										name="sizedWarehouse"
										title="Bodega de destino"
										lista={bodegas}
										value={sizedWarehouse}
										onChange={(v) => setSizedWarehouse(v as string)}
										error={""}
									/>
								</div>
							</div>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Ingresa la cantidad por talla y selecciona el estante donde guardarás el stock físico.
					</p>

					<div className="border rounded-lg overflow-hidden flex flex-col">
						<div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 border-b grid grid-cols-[5rem_1fr_6rem] gap-4">
							<span>Talla</span>
							<span>Estantería de Destino</span>
							<span className="text-right">Cantidad</span>
						</div>
						<div className="divide-y max-h-[400px] overflow-y-auto">
							{sizedRows.map((row, i) => (
								<div key={row.size} className="px-4 py-2 grid grid-cols-[5rem_1fr_6rem] gap-4 items-center hover:bg-slate-50 transition-colors">
									<span className="font-mono font-bold text-slate-700">{row.size}</span>
									<SelectField
										item={{ idx: 'id', value: 'nombre' }}
										name={`estanteria_${i}`}
										title=""
										lista={shelves}
										value={row.estanteria_id}
										onChange={(v) => updateSizedRow(i, 'estanteria_id', v as string)}
										error={""}
										placeholder="Seleccionar estante..."
										disabled={!sizedWarehouse}
									/>
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

				<div className="p-4 bg-slate-50 border-t flex items-center justify-between">
					<div>
						<p className="text-[10px] uppercase font-bold text-slate-400">Total a tallar</p>
						<p className={`text-lg font-bold ${sizedTotal > caja.cantidad ? 'text-red-600' : 'text-slate-900'}`}>
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
