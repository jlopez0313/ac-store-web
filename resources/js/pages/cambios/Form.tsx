import { Button } from '@/components/ui/button';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Package, Plus, RefreshCcw, Search, ShoppingBag, ShoppingCart, Undo2 } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type ThisForm = {
	local_id: string;
	venta_id: string;
	venta_detalle_id: string;
	nuevo_producto_id: string;
	nuevo_inventario_id: string;
	precio_nuevo: number;
	cuenta_id: string;
	talla_nueva: string;
};

export const Form = ({ cuentas, locals, onClose, onStore, onReload }: any) => {
	const { user } = useAuth();
	const isSuperAdmin = user?.role === 'superadmin';

	const [step, setStep] = useState(1);
	const [invoices, setInvoices] = useState<any[]>([]);
	const [invoiceDetails, setInvoiceDetails] = useState<any[]>([]);
	const [references, setReferences] = useState<any[]>([]);
	const [stockItems, setStockItems] = useState<any[]>([]);
	const [loading, setLoading] = useState<Record<string, boolean>>({});
	const [searchCode, setSearchCode] = useState('');

	const { data, setData, errors, reset, setError, processing } = useForm<ThisForm>({
		local_id: '',
		venta_id: '',
		venta_detalle_id: '',
		nuevo_producto_id: '',
		nuevo_inventario_id: '',
		precio_nuevo: 0,
		cuenta_id: isSuperAdmin ? '' : (user?.cuenta_id?.toString() || ''),
		talla_nueva: '',
	});

	// Fetch references only for the chosen account
	useEffect(() => {
		if (data.cuenta_id && step >= 2) {
			fetchReferences();
		}
	}, [data.cuenta_id, step]);

	// Auto-fetch invoices when local and account are selected
	useEffect(() => {
		if (data.local_id && data.cuenta_id && step === 1) {
			fetchInvoices(data.local_id);
		}
	}, [data.local_id, data.cuenta_id, step]);

	const fetchInvoices = async (localId: string, codigo?: string) => {
		setLoading(prev => ({ ...prev, invoices: true }));
		setInvoiceDetails([]);
		setData('venta_id', '');
		try {
			const res = await axios.get(route('api.cambios.invoices', {
				local_id: localId,
				cuenta_id: data.cuenta_id,
				codigo: codigo || searchCode
			}));
			setInvoices(res.data.data);
			if (res.data.data.length === 0 && (codigo || searchCode)) {
				showAlert('info', 'No se encontraron facturas con esa referencia.');
			}
		} catch (error: any) {
			showAlert('error', 'Error al cargar facturas');
		} finally {
			setLoading(prev => ({ ...prev, invoices: false }));
		}
	};

	const fetchInvoiceDetails = async (ventaId: string) => {
		if (!ventaId) {
			setInvoiceDetails([]);
			return;
		}
		setLoading(prev => ({ ...prev, details: true }));
		try {
			const res = await axios.get(route('api.cambios.invoice_details', { venta_id: ventaId }));
			setInvoiceDetails(res.data.data);
		} catch (error: any) {
			showAlert('error', 'Error al cargar detalles de la factura');
		} finally {
			setLoading(prev => ({ ...prev, details: false }));
		}
	};

	const fetchReferences = async () => {
		setLoading(prev => ({ ...prev, refs: true }));
		try {
			const res = await axios.get(route('api.muestras.references', { cuenta_id: data.cuenta_id }));
			setReferences(res.data);
		} catch (error: any) {
			showAlert('error', 'Error al cargar productos');
		} finally {
			setLoading(prev => ({ ...prev, refs: false }));
		}
	};

	const fetchStock = async (refId: string) => {
		setLoading(prev => ({ ...prev, stock: true }));
		try {
			const res = await axios.get(route('api.muestras.stock', { referencia_id: refId }));
			setStockItems(res.data.data);
		} catch (error: any) {
			showAlert('error', 'Error al cargar stock');
		} finally {
			setLoading(prev => ({ ...prev, stock: false }));
		}
	};

	const selectedDetalle = useMemo(() => {
		return invoiceDetails.find(d => d.id?.toString() === data.venta_detalle_id);
	}, [data.venta_detalle_id, invoiceDetails]);

	const selectedNuevoInv = useMemo(() => {
		return stockItems.find(i => i.id?.toString() === data.nuevo_inventario_id);
	}, [data.nuevo_inventario_id, stockItems]);

	const isPriceLower = useMemo(() => {
		return (data.precio_nuevo || 0) < (selectedDetalle?.precio_unitario || 0);
	}, [data.precio_nuevo, selectedDetalle]);

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();
		try {
			await onStore(
				() => ({ url: route('api.cambios.store') }),
				null,
				data,
				false,
				(err: any) => {
					if (err.response?.data?.error) {
						showAlert('error', err.response.data.error);
					}
				}
			);
			onReload();
			onClose();
		} catch (error) {
			console.error(error);
		}
	};

	const nextStep = () => setStep(prev => prev + 1);
	const prevStep = () => setStep(prev => prev - 1);

	return (
		<div className="flex flex-col h-[80vh] bg-slate-50/30">
			{/* Progress Tracker */}
			<div className="px-6 py-4 bg-white border-b flex items-center justify-between">
				<div className="flex items-center gap-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center">
							<div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === i ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' :
								step > i ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
								}`}>
								{step > i ? <CheckCircle2 className="h-4 w-4" /> : i}
							</div>
							{i < 3 && <ChevronRight className="h-4 w-4 mx-1 text-slate-200" />}
						</div>
					))}
				</div>
				<div className="flex items-center gap-4">
					<div className="text-right">
						<span className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">Paso {step} de 3</span>
						<h2 className="text-sm font-bold text-slate-900">
							{step === 1 && 'Búsqueda de Factura y Devolución'}
							{step === 2 && 'Ítem de Reemplazo'}
							{step === 3 && 'Confirmación'}
						</h2>
					</div>
				</div>
			</div>

			<form onSubmit={submit} className="flex-1 overflow-y-auto p-6">
				{/* STEP 1: SEARCH & DETAIL SELECTION */}
				{step === 1 && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-end">
							{isSuperAdmin && (
								<SelectField
									name="cuenta_id"
									title="Cuenta"
									required
									value={data.cuenta_id}
									onChange={(val) => {
										setData((old) => ({ ...old, cuenta_id: val as string, local_id: '', venta_id: '' }));
										setInvoices([]);
										setInvoiceDetails([]);
									}}
									lista={cuentas}
									item={{ idx: 'id', value: 'nombre' }}
									error={errors.cuenta_id}
								/>
							)}
							<SelectField
								name="local_id"
								title="Local"
								required
								value={data.local_id}
								onChange={(val) => {
									setData((old) => ({ ...old, local_id: val as string, venta_id: '' }));
									setInvoices([]);
								}}
								lista={locals}
								item={{ idx: 'id', value: 'name' }}
								error={errors.local_id}
							/>
							<div className="space-y-2">
								<Label className="text-xs tracking-wider">Ref. Vendida (Opcional)</Label>
								<div className="relative">
									<InputField
										name="searchCode"
										title=""
										placeholder="Ej: ABC-123"
										value={searchCode}
										onChange={(val) => setSearchCode(val.toUpperCase())}
										className="pr-10"
									/>
									<button
										type="button"
										onClick={() => fetchInvoices(data.local_id)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
									>
										<Search className="h-4 w-4" />
									</button>
								</div>
							</div>
							<SelectField
								name="venta_id"
								title="Factura Encontrada"
								required
								disabled={loading.invoices || !data.local_id}
								value={data.venta_id}
								onChange={(val) => {
									setData('venta_id', val as string);
									fetchInvoiceDetails(val as string);
								}}
								lista={invoices.map(inv => ({ id: inv.id.toString(), label: `Factura #${inv.id} - ${new Date(inv.fecha).toLocaleDateString()} ($${Number(inv.total).toLocaleString()})` }))}
								item={{ idx: 'id', value: 'label' }}
								error={errors.venta_id}
							/>
						</div>

						{data.venta_id && (
							<div className="space-y-4">
								<Label className="text-xs uppercase text-slate-400 tracking-wider flex items-center gap-2">
									<Package className="h-4 w-4" />
									Selecciona el producto a devolver
								</Label>
								<div className="flex flex-col gap-2 pb-20">
									{loading.details ? (
										[1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-slate-100 animate-pulse rounded-xl" />)
									) : [...invoiceDetails].sort((a, b) => (a.producto?.codigo || '').localeCompare(b.producto?.codigo || '')).map((det) => (
										<button
											key={det.id}
											type="button"
											onClick={() => {
												setData('venta_detalle_id', det.id.toString());
												nextStep();
											}}
											className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left group"
										>
											<div className="flex items-center gap-4">
												<div className="h-10 w-10 bg-indigo-50 rounded-lg overflow-hidden flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
													{det.producto?.foto ? (
														<img
															src={det.producto.foto.startsWith('http') ? det.producto.foto : `/storage/${det.producto.foto}`}
															alt={det.producto?.codigo}
															className="h-full w-full object-cover"
														/>
													) : (
														<ShoppingBag className="h-5 w-5" />
													)}
												</div>
												<div>
													<p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors uppercase">{det.producto?.codigo}</p>
													<p className="text-xs text-slate-500 font-medium">Talla: <span className="text-slate-700">{det.talla}</span> | Cant: <span className="text-slate-700">{det.cantidad}</span></p>
												</div>
											</div>
											<div className="text-right flex flex-col items-end">
												<p className="text-sm font-medium text-slate-900">${Number(det.precio_unitario).toLocaleString()}</p>
											</div>
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* STEP 2: REPLACEMENT ITEM */}
				{step === 2 && (
					<div className="space-y-6">
						<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between mb-4 shadow-sm">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 bg-amber-100 rounded-lg overflow-hidden flex items-center justify-center">
									{selectedDetalle?.producto?.foto ? (
										<img
											src={selectedDetalle.producto.foto.startsWith('http') ? selectedDetalle.producto.foto : `/storage/${selectedDetalle.producto.foto}`}
											alt={selectedDetalle.producto?.codigo}
											className="h-full w-full object-cover"
										/>
									) : (
										<Undo2 className="h-5 w-5 text-amber-600" />
									)}
								</div>
								<div>
									<p className="text-[10px] font-medium text-amber-800 uppercase tracking-widest">PRODUCTO A DEVOLVER</p>
									<p className="text-sm font-black text-amber-900">{selectedDetalle?.producto?.codigo} (Talla {selectedDetalle?.talla})</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-xs font-medium text-amber-900">${Number(selectedDetalle?.precio_unitario).toLocaleString()}</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
							<div className="space-y-6">
								<SelectField
									name="nuevo_producto_id"
									title="Nuevo Producto (Reemplazo)"
									required
									disabled={loading.refs}
									value={data.nuevo_producto_id}
									onChange={(val) => {
										setData('nuevo_producto_id', val as string);
										fetchStock(val as string);
									}}
									error={errors.nuevo_producto_id}
									lista={references.map(r => ({ id: r.id.toString(), label: `${r.codigo} - ${r.descripcion}` }))}
									item={{ idx: 'id', value: 'label' }}
								/>

								{data.nuevo_producto_id && (
									<SelectField
										name="nuevo_inventario_id"
										title="Seleccionar Stock / Bodega"
										required
										error={errors.nuevo_inventario_id}
										disabled={loading.stock}
										value={data.nuevo_inventario_id}
										onChange={(val) => {
											const selected = stockItems.find(i => i.id?.toString() === val);
											setData((old) => ({
												...old,
												nuevo_inventario_id: val as string,
												precio_nuevo: Number(selected?.precio_venta || 0),
												talla_nueva: selected?.talla || '',
											}));
										}}
										lista={stockItems.map(i => ({
											id: i.id.toString(),
											label: `Bodega: ${i.bodega_nombre} | Talla: ${i.talla} | Stock: ${i.stock} | Precio: $${Number(i.precio_venta).toLocaleString()}`
										}))}
										item={{ idx: 'id', value: 'label' }}
									/>
								)}
							</div>

							<div className="flex flex-col justify-center items-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
								{selectedNuevoInv ? (
									<div className="w-full space-y-4">
										<InputField
											name="precio_nuevo"
											title="Confirmar Valor Venta"
											type="number"
											value={data.precio_nuevo.toString()}
											onChange={(val) => setData('precio_nuevo', Number(val))}
											error={errors.precio_nuevo}
										/>
										<Button
											type="button"
											onClick={nextStep}
											disabled={!data.precio_nuevo}
											className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md shadow-indigo-100"
										>
											Siguiente Paso <ArrowRight className="h-4 w-4 ml-2" />
										</Button>
									</div>
								) : (
									<div className="text-center text-slate-400">
										<ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-10" />
										<p className="text-xs font-bold uppercase tracking-widest">Selecciona un producto para continuar</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* STEP 3: CONFIRMATION */}
				{step === 3 && (
					<div className="max-w-lg mx-auto space-y-8 pt-6">
						<div className="text-center space-y-2">
							<div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<RefreshCcw className="h-8 w-8" />
							</div>
							<h3 className="font-medium text-slate-900">Resumen Final</h3>
							<p className="text-slate-500 text-sm">Verifica los subtotales y valores a cobrar antes de procesar.</p>
						</div>

						<div className="bg-white border rounded-2xl overflow-hidden shadow-xl border-slate-100">
							<div className="p-4 border-b flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
								<span>DETALLE DEL CAMBIO</span>
								<RefreshCcw className="h-3 w-3" />
							</div>
							<div className="p-6 space-y-3">
								<div className="flex items-start justify-between">
									<div className="flex gap-4">
										<div className="h-12 w-12 bg-red-50 rounded-xl overflow-hidden flex items-center justify-center border border-red-100">
											{selectedDetalle?.producto?.foto ? (
												<img
													src={selectedDetalle.producto.foto.startsWith('http') ? selectedDetalle.producto.foto : `/storage/${selectedDetalle.producto.foto}`}
													alt={selectedDetalle.producto?.codigo}
													className="h-full w-full object-cover"
												/>
											) : (
												<Undo2 className="h-6 w-6 text-red-600" />
											)}
										</div>
										<div>
											<p className="text-[10px] font-medium text-red-500 uppercase">A DEVOLVER</p>
											<p className="text-sm font-medium text-slate-900">{selectedDetalle?.producto?.codigo}</p>
											<p className="text-xs text-slate-500 font-medium">Talla {selectedDetalle?.talla}</p>
										</div>
									</div>
									<p className="font-medium text-slate-900">${Number(selectedDetalle?.precio_unitario).toLocaleString()}</p>
								</div>

								<div className="flex justify-center flex-col items-center gap-1">
									<ChevronDown className="h-4 w-4 text-slate-300" />
								</div>

								<div className="flex items-start justify-between">
									<div className="flex gap-4">
										<div className="h-12 w-12 bg-indigo-50 rounded-xl overflow-hidden flex items-center justify-center border border-indigo-100">
											{selectedNuevoInv?.referencia_foto ? (
												<img
													src={selectedNuevoInv.referencia_foto.startsWith('http') ? selectedNuevoInv.referencia_foto : `/storage/${selectedNuevoInv.referencia_foto}`}
													alt="Reemplazo"
													className="h-full w-full object-cover"
												/>
											) : (
												<Plus className="h-6 w-6 text-indigo-600" />
											)}
										</div>
										<div>
											<p className="text-[10px] font-medium text-indigo-500 uppercase">REEMPLAZO</p>
											<p className="text-sm font-medium text-slate-900">
												{references.find(r => r.id.toString() === data.nuevo_producto_id)?.codigo}
											</p>
											<p className="text-xs text-slate-500 font-medium">Talla {selectedNuevoInv?.talla} · {selectedNuevoInv?.bodega_nombre}</p>
										</div>
									</div>
									<p className="font-medium text-slate-900">${Number(data.precio_nuevo).toLocaleString()}</p>
								</div>
							</div>

							<div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
								<div>
									<p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">TOTAL A COBRAR (Diferencia)</p>
									{data.precio_nuevo - (selectedDetalle?.precio_unitario || 0) < 0 ? (
										<p className="text-xs text-red-400 font-bold uppercase mb-2 font-mono tracking-tighter">
											Aviso: El nuevo item tiene menor valor.
										</p>
									) : null}
									<p className="text-xl font-medium tabular-nums tracking-tighter border-l-4 border-indigo-500 pl-4">
										${(data.precio_nuevo - (selectedDetalle?.precio_unitario || 0)).toLocaleString()}
									</p>
								</div>
								<div className="flex flex-col gap-2">
									<FormButtons
										processing={processing}
										reset={() => setStep(1)}
										buttons={{ submit: true }}
										labels={{ submit: 'PROCESAR CAMBIO' }}
										submitDisabled={isPriceLower}
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</form>

			<div className="px-6 py-4 bg-white border-t flex justify-between items-center">
				<Button
					variant="outline"
					onClick={onClose}
				>
					Cancelar
				</Button>

				{step > 1 && (
					<Button
						variant="outline"
						onClick={prevStep}
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Regresar
					</Button>
				)}
			</div>
		</div>
	);
};
