import { Button } from '@/components/ui/button';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Package,
    Plus,
    RefreshCcw,
    Search,
    ShoppingBag,
    ShoppingCart,
    Undo2,
} from 'lucide-react';
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
    observacion: string;
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
    const [localAccesos, setLocalAccesos] = useState<any[]>([]);
    const [selectedBodegaId, setSelectedBodegaId] = useState<string>('');
    const [selectedEstanteriaId, setSelectedEstanteriaId] = useState<string>('');

    const { data, setData, errors, reset, setError, processing } = useForm<ThisForm>({
        local_id: '',
        venta_id: '',
        venta_detalle_id: '',
        nuevo_producto_id: '',
        nuevo_inventario_id: '',
        precio_nuevo: 0,
        cuenta_id: isSuperAdmin ? '' : user?.cuenta_id?.toString() || '',
        talla_nueva: '',
        observacion: '',
    });

    useEffect(() => {
        if (!isSuperAdmin && user?.id && !data.local_id) {
            setData('local_id', user.id.toString());
        }
    }, [isSuperAdmin, user?.id]);

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
            fetchLocalAccesos(data.local_id);
        }
    }, [data.local_id, data.cuenta_id, step]);

    const fetchInvoices = async (localId: string, codigo?: string) => {
        setLoading((prev) => ({ ...prev, invoices: true }));
        setInvoiceDetails([]);
        setData('venta_id', '');
        try {
            const res = await axios.get(
                route('api.cambios.invoices', {
                    local_id: localId,
                    cuenta_id: data.cuenta_id,
                    codigo: codigo || searchCode,
                }),
            );
            setInvoices(res.data.data);
            if (res.data.data.length === 0 && (codigo || searchCode)) {
                showAlert('info', 'No se encontraron facturas con esa referencia.');
            }
        } catch (error: any) {
            showAlert('error', 'Error al cargar facturas');
        } finally {
            setLoading((prev) => ({ ...prev, invoices: false }));
        }
    };

    const fetchInvoiceDetails = async (ventaId: string) => {
        if (!ventaId) {
            setInvoiceDetails([]);
            return;
        }
        setLoading((prev) => ({ ...prev, details: true }));
        try {
            const res = await axios.get(route('api.cambios.invoice_details', { venta_id: ventaId }));
            setInvoiceDetails(res.data.data);
        } catch (error: any) {
            showAlert('error', 'Error al cargar detalles de la factura');
        } finally {
            setLoading((prev) => ({ ...prev, details: false }));
        }
    };

    const fetchLocalAccesos = async (localId: string) => {
        try {
            const res = await axios.get(route('api.usuarios.accesos', { usuario: localId, per_page: 100 }));
            setLocalAccesos(res.data.data || []);
        } catch (error) {
            console.error('Error fetching local accesos:', error);
            setLocalAccesos([]);
        }
    };

    const fetchReferences = async () => {
        setLoading((prev) => ({ ...prev, refs: true }));
        try {
            const res = await axios.get(route('api.muestras.references', { cuenta_id: data.cuenta_id }));
            setReferences(res.data);
        } catch (error: any) {
            showAlert('error', 'Error al cargar productos');
        } finally {
            setLoading((prev) => ({ ...prev, refs: false }));
        }
    };

    const fetchStock = async (refId: string) => {
        if (!refId) {
            setStockItems([]);
            setSelectedBodegaId('');
            setSelectedEstanteriaId('');
            return;
        }
        setLoading((prev) => ({ ...prev, stock: true }));
        try {
            const res = await axios.get(route('api.muestras.stock', { referencia_id: refId }));
            setStockItems(res.data.data);
        } catch (error: any) {
            showAlert('error', 'Error al cargar stock');
        } finally {
            setLoading((prev) => ({ ...prev, stock: false }));
        }
    };

    const selectedDetalle = useMemo(() => {
        return invoiceDetails.find((d) => d.id?.toString() === data.venta_detalle_id);
    }, [data.venta_detalle_id, invoiceDetails]);

    const selectedNuevoInv = useMemo(() => {
        return stockItems.find((i) => i.id?.toString() === data.nuevo_inventario_id);
    }, [data.nuevo_inventario_id, stockItems]);

    const isPriceLower = useMemo(() => {
        return (data.precio_nuevo || 0) < (selectedDetalle?.precio_unitario || 0);
    }, [data.precio_nuevo, selectedDetalle]);

    // Reactive pricing logic
    useEffect(() => {
        if (data.nuevo_inventario_id && localAccesos.length > 0) {
            const selected = stockItems.find((i) => i.id?.toString() === data.nuevo_inventario_id);
            if (selected) {
                const basePrice = Number(selected.precio_venta || 0);
                const acceso = localAccesos.find((a) => Number(a.id) === Number(selectedBodegaId));
                const discount = Number(acceso?.descuento || 0);

                let newPrice = Math.max(0, basePrice - discount);

                // Ensure price is not lower than returned product
                const returnedPrice = Number(selectedDetalle?.precio_unitario || 0);
                if (newPrice < returnedPrice) {
                    newPrice = returnedPrice;
                }

                if (newPrice !== data.precio_nuevo) {
                    setData('precio_nuevo', newPrice);
                }
            }
        }
    }, [data.nuevo_inventario_id, localAccesos, selectedBodegaId, stockItems, selectedDetalle]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setLoading((prev) => ({ ...prev, storing: true }));
        try {
            await onStore(data);
            showAlert('success', 'Cambio procesado exitosamente');
            onReload();
            onClose();
        } catch (error: any) {
            console.error(error);
            if (error.response?.data?.error) {
                showAlert('error', error.response.data.error);
            } else if (error.response?.data?.errors) {
                const validationErrors = error.response.data.errors;
                showAlert('error', Object.values(validationErrors).flat().join('\n'));
            } else if (error.response?.data?.message) {
                showAlert('error', error.response.data.message);
            } else {
                showAlert('error', 'Error al procesar el cambio');
            }
        } finally {
            setLoading((prev) => ({ ...prev, storing: false }));
        }
    };

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    return (
        <div className="flex h-[80vh] flex-col bg-slate-50/30 dark:bg-slate-900/30">
            {/* Progress Tracker */}
            <div className="flex items-center justify-between border-b bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${step === i
                                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 dark:ring-indigo-950'
                                        : step > i
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                                    }`}
                            >
                                {step > i ? <CheckCircle2 className="h-4 w-4" /> : i}
                            </div>
                            {i < 3 && <ChevronRight className="mx-1 h-4 w-4 text-slate-200 dark:text-slate-600" />}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-[10px] font-black tracking-widest text-[#64748b] uppercase">Paso {step} de 3</span>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
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
                        <div className="grid grid-cols-1 items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
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
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
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
                                lista={invoices.map((inv) => ({
                                    id: inv.id.toString(),
                                    label: `Factura #${inv.id} - ${new Date(inv.fecha).toLocaleDateString()} ($${Number(inv.total).toLocaleString()})`,
                                }))}
                                item={{ idx: 'id', value: 'label' }}
                                error={errors.venta_id}
                            />
                        </div>

                        {data.venta_id && (
                            <div className="space-y-4">
                                <Label className="flex items-center gap-2 text-xs tracking-wider text-slate-400 uppercase">
                                    <Package className="h-4 w-4" />
                                    Selecciona el producto a devolver
                                </Label>
                                <div className="flex flex-col gap-2 pb-20">
                                    {loading.details
                                        ? [1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="h-16 animate-pulse rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
                                            />
                                        ))
                                        : [...invoiceDetails]
                                            .sort((a, b) => (a.producto?.codigo || '').localeCompare(b.producto?.codigo || ''))
                                            .map((det) => (
                                                <button
                                                    key={det.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setData('venta_detalle_id', det.id.toString());
                                                        nextStep();
                                                    }}
                                                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-indigo-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                                                            {det.producto?.foto ? (
                                                                <img
                                                                    src={
                                                                        det.producto.foto.startsWith('http')
                                                                            ? det.producto.foto
                                                                            : `/storage/${det.producto.foto}`
                                                                    }
                                                                    alt={det.producto?.codigo}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <ShoppingBag className="h-5 w-5" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 uppercase transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                                                {det.producto?.codigo}
                                                            </p>
                                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                Talla: <span className="text-slate-700 dark:text-slate-300">{det.talla}</span> |
                                                                Cant: <span className="text-slate-700 dark:text-slate-300">{det.cantidad}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                            ${Number(det.precio_unitario).toLocaleString()}
                                                        </p>
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
                        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-amber-100">
                                    {selectedDetalle?.producto?.foto ? (
                                        <img
                                            src={
                                                selectedDetalle.producto.foto.startsWith('http')
                                                    ? selectedDetalle.producto.foto
                                                    : `/storage/${selectedDetalle.producto.foto}`
                                            }
                                            alt={selectedDetalle.producto?.codigo}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Undo2 className="h-5 w-5 text-amber-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium tracking-widest text-amber-800 uppercase">PRODUCTO A DEVOLVER</p>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                        {selectedDetalle?.producto?.codigo} (Talla {selectedDetalle?.talla})
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                                    ${Number(selectedDetalle?.precio_unitario).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
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
                                    lista={references.map((r) => ({ id: r.id.toString(), label: `${r.codigo} - ${r.descripcion}` }))}
                                    item={{ idx: 'id', value: 'label' }}
                                />

                                {data.nuevo_producto_id && (
                                    <>
                                        <SelectField
                                            name="bodega_id"
                                            title="Seleccionar Bodega"
                                            required
                                            disabled={loading.stock}
                                            value={selectedBodegaId}
                                            onChange={(val) => {
                                                setSelectedBodegaId(val as string);
                                                setSelectedEstanteriaId('');
                                                setData('nuevo_inventario_id', '');
                                                setData('precio_nuevo', 0);
                                            }}
                                            lista={Array.from(new Set(stockItems.map((i) => i.bodega_id))).map((id) => {
                                                const item = stockItems.find((i) => i.bodega_id === id);
                                                return { id: id.toString(), label: item?.bodega_nombre || 'Desconocida' };
                                            })}
                                            item={{ idx: 'id', value: 'label' }}
                                        />

                                        {selectedBodegaId && (
                                            <SelectField
                                                name="estanteria_id"
                                                title="Seleccionar Estantería"
                                                required
                                                disabled={loading.stock}
                                                value={selectedEstanteriaId}
                                                onChange={(val) => {
                                                    setSelectedEstanteriaId(val as string);
                                                    setData('nuevo_inventario_id', '');
                                                }}
                                                lista={Array.from(
                                                    new Set(
                                                        stockItems
                                                            .filter((i) => i.bodega_id?.toString() === selectedBodegaId)
                                                            .map((i) => i.estanteria_id),
                                                    ),
                                                ).map((id) => {
                                                    const item = stockItems.find((i) => i.estanteria_id === id);
                                                    return { id: id?.toString() ?? 'null', label: item?.estanteria_nombre || 'General' };
                                                })}
                                                item={{ idx: 'id', value: 'label' }}
                                            />
                                        )}

                                        {selectedEstanteriaId && (
                                            <SelectField
                                                name="nuevo_inventario_id"
                                                title="Seleccionar Talla / Stock"
                                                required
                                                error={errors.nuevo_inventario_id}
                                                disabled={loading.stock}
                                                value={data.nuevo_inventario_id}
                                                onChange={(val) => {
                                                    const selected = stockItems.find((i) => i.id?.toString() === val);
                                                    if (selected) {
                                                        setData((old) => ({
                                                            ...old,
                                                            nuevo_inventario_id: val as string,
                                                            talla_nueva: selected.talla || '',
                                                        }));
                                                    }
                                                }}
                                                lista={stockItems
                                                    .filter((i) => 
                                                        i.bodega_id?.toString() === selectedBodegaId &&
                                                        (i.estanteria_id?.toString() ?? 'null') === selectedEstanteriaId
                                                    )
                                                    .map((i) => ({
                                                        id: i.id.toString(),
                                                        label: `Talla: ${i.talla} (Disponible: ${i.stock})`,
                                                    }))}
                                                item={{ idx: 'id', value: 'label' }}
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/30">
                                {selectedNuevoInv ? (
                                    <div className="w-full space-y-4">
                                        <div className="flex flex-col gap-1 px-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Sugerido: <span className="text-slate-600 dark:text-slate-300">${Number(selectedNuevoInv.precio_venta || 0).toLocaleString()}</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Descuento: <span className="text-amber-600">-${Number(localAccesos.find(a => Number(a.id) === Number(selectedBodegaId))?.descuento || 0).toLocaleString()}</span>
                                            </span>
                                        </div>

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
                                            className="h-12 w-full bg-indigo-600 font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700"
                                        >
                                            Siguiente Paso <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <ShoppingCart className="mx-auto mb-2 h-10 w-10 opacity-10" />
                                        <p className="text-xs font-bold tracking-widest uppercase">Selecciona un producto para continuar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONFIRMATION */}
                {step === 3 && (
                    <div className="mx-auto max-w-lg space-y-8 pt-6">
                        <div className="space-y-2 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                <RefreshCcw className="h-8 w-8" />
                            </div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Resumen Final</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Verifica los subtotales y valores a cobrar antes de procesar.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b bg-slate-50/50 p-4 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500">
                                <span>DETALLE DEL CAMBIO</span>
                                <RefreshCcw className="h-3 w-3" />
                            </div>
                            <div className="space-y-3 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-red-100 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                                            {selectedDetalle?.producto?.foto ? (
                                                <img
                                                    src={
                                                        selectedDetalle.producto.foto.startsWith('http')
                                                            ? selectedDetalle.producto.foto
                                                            : `/storage/${selectedDetalle.producto.foto}`
                                                    }
                                                    alt={selectedDetalle.producto?.codigo}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Undo2 className="h-6 w-6 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-red-500 uppercase">A DEVOLVER</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {selectedDetalle?.producto?.codigo}
                                            </p>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Talla {selectedDetalle?.talla}</p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-slate-900 dark:text-slate-100">
                                        ${Number(selectedDetalle?.precio_unitario).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-1">
                                    <ChevronDown className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                </div>

                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30">
                                            {selectedNuevoInv?.referencia_foto ? (
                                                <img
                                                    src={
                                                        selectedNuevoInv.referencia_foto.startsWith('http')
                                                            ? selectedNuevoInv.referencia_foto
                                                            : `/storage/${selectedNuevoInv.referencia_foto}`
                                                    }
                                                    alt="Reemplazo"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Plus className="h-6 w-6 text-indigo-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-indigo-500 uppercase">REEMPLAZO</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {references.find((r) => r.id.toString() === data.nuevo_producto_id)?.codigo}
                                            </p>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Talla {selectedNuevoInv?.talla} · {selectedNuevoInv?.bodega_nombre}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-slate-900 dark:text-slate-100">${Number(data.precio_nuevo).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2 px-6 pb-6">
                                <Label className="text-[10px] font-black text-slate-400 uppercase">
                                    Observación del Cambio <span className="text-red-500">*</span>
                                </Label>
                                <textarea
                                    required
                                    className={`min-h-[80px] w-full resize-none rounded-xl border bg-slate-50 p-3 text-sm transition-all outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${errors.observacion ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700'}`}
                                    placeholder="Indica el motivo del cambio (Obligatorio)..."
                                    value={data.observacion}
                                    onChange={(e) => setData('observacion', e.target.value)}
                                />
                                {errors.observacion && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.observacion}</p>}
                            </div>

                            <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white dark:bg-slate-950">
                                <div>
                                    <p className="mb-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                        TOTAL A COBRAR (Diferencia)
                                    </p>
                                    {data.precio_nuevo - (selectedDetalle?.precio_unitario || 0) < 0 ? (
                                        <p className="mb-2 font-mono text-xs font-bold tracking-tighter text-red-400 uppercase">
                                            Aviso: El nuevo item tiene menor valor.
                                        </p>
                                    ) : null}
                                    <p className="border-l-4 border-indigo-500 pl-4 text-xl font-medium tracking-tighter tabular-nums">
                                        ${(data.precio_nuevo - (selectedDetalle?.precio_unitario || 0)).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormButtons
                                        processing={processing || !!loading.storing}
                                        reset={() => setStep(1)}
                                        buttons={{ submit: true }}
                                        labels={{ submit: 'PROCESAR CAMBIO' }}
                                        submitDisabled={isPriceLower || !data.observacion.trim() || data.observacion.trim().length < 5}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            <div className="flex items-center justify-between border-t bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                <Button variant="outline" onClick={onClose}>
                    Cancelar
                </Button>

                {step > 1 && (
                    <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Regresar
                    </Button>
                )}
            </div>
        </div>
    );
};
