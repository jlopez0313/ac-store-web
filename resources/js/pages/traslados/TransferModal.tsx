import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Modal } from '@/components/ui/Modal';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { showAlert } from '@/plugins/sweetalert';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const TransferModal = ({ isOpen, onClose, cuentas, referenciasInit }: any) => {
    const [loading, setLoading] = useState(false);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const viewerOpenRef = useRef(false);

    const { auth } = usePage().props as any;
    const isSuperAdmin = !!cuentas?.length;

    // Form data
    const [selectedCuenta, setSelectedCuenta] = useState(isSuperAdmin ? '' : String(auth.user.cuenta_id));
    const [selectedRef, setSelectedRef] = useState('');
    const [inventoryDetails, setInventoryDetails] = useState<any[]>([]);

    // Origin selectors (Phase 2)
    const [originBodega, setOriginBodega] = useState('');
    const [originEstanteria, setOriginEstanteria] = useState('');
    const [originTalla, setOriginTalla] = useState('');

    // Destination selectors (Phase 3)
    const [destBodega, setDestBodega] = useState('');
    const [destEstanteria, setDestEstanteria] = useState('');
    const [cantidad, setCantidad] = useState('1');

    const handleModalClose = useCallback(() => {
        if (!viewerOpenRef.current) {
            onClose();
        }
    }, [onClose]);

    const openViewer = (foto: string) => {
        viewerOpenRef.current = true;
        setViewerImage(foto);
    };

    const closeViewer = () => {
        viewerOpenRef.current = false;
        setViewerImage(null);
    };

    // Options
    const [referencias, setReferencias] = useState<any[]>(referenciasInit || []);
    const [bodegasDestino, setBodegasDestino] = useState<any[]>([]);
    const [estanteriasDestino, setEstanteriasDestino] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedRef('');
            setInventoryDetails([]);
            setOriginBodega('');
            setOriginEstanteria('');
            setOriginTalla('');
            setDestBodega('');
            setDestEstanteria('');
            setCantidad('1');
        }
    }, [isOpen]);

    // Handle initial account load for superadmin
    useEffect(() => {
        if (isOpen && selectedCuenta) {
            fetchReferencias(selectedCuenta);
            fetchBodegas(selectedCuenta);
        }
    }, [selectedCuenta, isOpen]);

    const fetchReferencias = async (cuentaId: string) => {
        setLoading(true);
        try {
            const res = await axios.get(route('api.traslados.referencias', { cuenta_id: cuentaId }));
            setReferencias(res.data);
        } finally {
            setLoading(false);
        }
    };

    const fetchBodegas = async (cuentaId: string) => {
        try {
            const res = await axios.get(route('api.traslados.bodegas', { cuenta_id: cuentaId }));
            setBodegasDestino(res.data);
        } catch (e) { }
    };

    const fetchInventory = async (refId: string) => {
        if (!refId) return;
        setLoading(true);
        try {
            const res = await axios.get(
                route('api.traslados.inventory', {
                    referencia_id: refId,
                    cuenta_id: selectedCuenta,
                }),
            );
            setInventoryDetails(res.data);
            if (res.data.length === 0) {
                showAlert('info', 'Esta referencia no tiene stock disponible para traslado.');
                setSelectedRef('');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchEstanterias = async (bodegaId: string) => {
        try {
            const res = await axios.get(route('api.traslados.estanterias', { bodega_id: bodegaId }));
            setEstanteriasDestino(res.data);
        } catch (e) { }
    };

    // ── Origin Logic ──
    const originBodegasDisponibles = useMemo(() => {
        const uniqueIds = new Set();
        return inventoryDetails.reduce((acc, item) => {
            if (!uniqueIds.has(item.bodega_id)) {
                uniqueIds.add(item.bodega_id);
                acc.push({ id: item.bodega_id, nombre: item.bodega_nombre });
            }
            return acc;
        }, [] as any[]);
    }, [inventoryDetails]);

    const originEstanteriasDisponibles = useMemo(() => {
        if (!originBodega) return [];
        const uniqueIds = new Set();
        return inventoryDetails
            .filter((item) => String(item.bodega_id) === String(originBodega))
            .reduce((acc, item) => {
                if (!uniqueIds.has(item.estanteria_id)) {
                    uniqueIds.add(item.estanteria_id);
                    acc.push({ id: item.estanteria_id, nombre: item.estanteria_nombre });
                }
                return acc;
            }, [] as any[]);
    }, [inventoryDetails, originBodega]);

    const originTallasDisponibles = useMemo(() => {
        if (!originEstanteria) return [];
        return inventoryDetails
            .filter((item) => String(item.estanteria_id) === String(originEstanteria))
            .map((item) => ({ id: item.talla, nombre: `${item.talla} (${item.stock} disponibles)` }));
    }, [inventoryDetails, originEstanteria]);

    const selectedOriginItem = useMemo(() => {
        return inventoryDetails.find((item) => String(item.estanteria_id) === String(originEstanteria) && String(item.talla) === String(originTalla));
    }, [inventoryDetails, originEstanteria, originTalla]);

    const [processing, setProcessing] = useState(false);

    const handleApplyTransfer = () => {
        if (!selectedOriginItem || !destEstanteria || !cantidad) {
            showAlert('warning', 'Por favor completa todos los campos.');
            return;
        }

        setProcessing(true);
        router.post(
            route('traslados.store'),
            {
                referencia_id: selectedRef,
                talla: selectedOriginItem.talla,
                estanteria_origen_id: selectedOriginItem.estanteria_id,
                estanteria_destino_id: destEstanteria,
                cantidad: cantidad,
                cuenta_id: selectedCuenta,
            },
            {
                onSuccess: () => {
                    showAlert('success', 'Traslado realizado correctamente.');
                    onClose();
                },
                onError: (err: any) => {
                    showAlert('error', err.cantidad || err.error || 'Error al procesar el traslado.');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    // const isSuperAdmin = !!cuentas?.length; (Moved up)

    // Formatted list for references selector
    const referenciasOptions = referencias.map((r) => ({ id: r.id, display: `${r.codigo} - ${r.descripcion}` }));

    const selectedRefData = useMemo(() => {
        return referencias.find((r: any) => String(r.id) === String(selectedRef));
    }, [referencias, selectedRef]);

    return (
        <Modal show={isOpen} onClose={handleModalClose} closeable={true} title="Realizar Traslado de Mercancía" maxWidth="3xl">
            <div className="space-y-6 p-6">
                {/* Product & Account Selection */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {isSuperAdmin && (
                        <SelectField
                            name="cuenta"
                            title="1. Cuenta"
                            item={{ idx: 'id', value: 'name' }}
                            lista={cuentas}
                            value={selectedCuenta}
                            onChange={(v) => {
                                setSelectedCuenta(v as string);
                                setSelectedRef('');
                                setInventoryDetails([]);
                            }}
                            error={''}
                        />
                    )}
                    <div className="space-y-3">
                        <SelectField
                            name="referencia_select"
                            title={isSuperAdmin ? "2. Producto" : "1. Producto a Trasladar"}
                            item={{ idx: 'id', value: 'display' }}
                            lista={referenciasOptions}
                            value={selectedRef}
                            onChange={(v) => {
                                setSelectedRef(v as string);
                                if (v) fetchInventory(v as string);
                            }}
                            disabled={isSuperAdmin && !selectedCuenta}
                            placeholder={isSuperAdmin && !selectedCuenta ? 'Selecciona una cuenta primero' : 'Escribe el código o descripción...'}
                            error={''}
                        />
                        {loading && (
                            <div className="flex items-center gap-2 p-1 text-[10px] text-slate-400 italic">
                                <Loader2 className="h-3 w-3 animate-spin" /> Buscando stock...
                            </div>
                        )}
                    </div>
                </div>

                {selectedRefData && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-3 duration-300">
                        {/* Selected Product Summary */}
                        <div className="flex items-center gap-4 rounded-md border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                            <div
                                className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                                onClick={() => selectedRefData?.foto && openViewer(selectedRefData.foto)}
                            >
                                {selectedRefData?.foto ? (
                                    <img src={`/storage/${selectedRefData.foto}`} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-center text-[8px] text-slate-400">Sin foto</div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                    {selectedRefData?.codigo}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                    {selectedRefData?.descripcion}
                                </p>
                            </div>
                        </div>

                        {/* Origin and Destination Grid */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* ORIGIN BLOCK */}
                            <div className="space-y-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 p-4 dark:border-indigo-900/20 dark:bg-indigo-950/10">
                                <h5 className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase dark:text-indigo-400">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">1</span>
                                    Origen del Stock
                                </h5>

                                <div className="space-y-3">
                                    <SelectField
                                        name="originBodega"
                                        title="Bodega"
                                        item={{ idx: 'id', value: 'nombre' }}
                                        lista={originBodegasDisponibles}
                                        value={originBodega}
                                        onChange={(v) => {
                                            setOriginBodega(v as string);
                                            setOriginEstanteria('');
                                            setOriginTalla('');
                                        }}
                                        error={''}
                                    />
                                    <SelectField
                                        name="originEstanteria"
                                        title="Estantería"
                                        item={{ idx: 'id', value: 'nombre' }}
                                        lista={originEstanteriasDisponibles}
                                        value={originEstanteria}
                                        onChange={(v) => {
                                            setOriginEstanteria(v as string);
                                            setOriginTalla('');
                                        }}
                                        disabled={!originBodega}
                                        error={''}
                                    />
                                    <SelectField
                                        name="originTalla"
                                        title="Talla"
                                        item={{ idx: 'id', value: 'nombre' }}
                                        lista={originTallasDisponibles}
                                        value={originTalla}
                                        onChange={(v) => setOriginTalla(v as string)}
                                        disabled={!originEstanteria}
                                        error={''}
                                    />
                                </div>
                            </div>

                            {/* DESTINATION BLOCK */}
                            <div className="space-y-4 rounded-2xl border border-emerald-50 bg-emerald-50/30 p-4 dark:border-emerald-900/20 dark:bg-emerald-950/10">
                                <h5 className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">2</span>
                                    Destino del Stock
                                </h5>

                                <div className="space-y-3">
                                    <SelectField
                                        name="destBodega"
                                        title="Bodega Destino"
                                        item={{ idx: 'id', value: 'nombre' }}
                                        lista={bodegasDestino}
                                        value={destBodega}
                                        onChange={(v) => {
                                            setDestBodega(v as string);
                                            fetchEstanterias(v as string);
                                        }}
                                        disabled={!selectedOriginItem}
                                        error={''}
                                    />
                                    <SelectField
                                        name="destEstanteria"
                                        title="Estantería Destino"
                                        item={{ idx: 'id', value: 'nombre' }}
                                        lista={estanteriasDestino}
                                        value={destEstanteria}
                                        onChange={(v) => setDestEstanteria(v as string)}
                                        disabled={!destBodega}
                                        error={''}
                                    />

                                    <div className="pt-1">
                                        <InputField
                                            name="cantidad"
                                            title="Cantidad"
                                            type="number"
                                            min="1"
                                            max={selectedOriginItem?.stock}
                                            value={cantidad}
                                            onChange={(v) => setCantidad(v)}
                                            disabled={!selectedOriginItem || processing}
                                        />
                                        {selectedOriginItem && (
                                            <p className="mt-1 text-[10px] text-slate-500 font-bold uppercase">
                                                Disponible: {selectedOriginItem.stock} unidades
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FINAL ACTION */}
                        <div className="pt-2">
                            <Button
                                className="w-full gap-3"
                                onClick={handleApplyTransfer}
                                disabled={processing || !destEstanteria || !selectedOriginItem || parseInt(cantidad) < 1 || parseInt(cantidad) > selectedOriginItem.stock}
                            >
                                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeftRight className="h-5 w-5" />}
                                {processing ? 'PROCESANDO TRASLADO...' : 'CONFIRMAR TRASLADO DE MERCANCÍA'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={closeViewer}
            />
        </Modal>
    );
};
