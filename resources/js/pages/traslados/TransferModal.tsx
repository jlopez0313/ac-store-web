import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Modal } from '@/components/ui/Modal';
import { showAlert } from '@/plugins/sweetalert';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeftRight, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ViewerModal } from '@/components/ui/ViewerModal';

export const TransferModal = ({ isOpen, onClose, cuentas, referenciasInit }: any) => {
    const [step, setStep] = useState(1);
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
            setStep(1);
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
        } catch (e) {}
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
            if (res.data.length > 0) {
                setStep(2);
            } else {
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
        } catch (e) {}
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
        <Modal show={isOpen} onClose={handleModalClose} closeable={true} title="Realizar Traslado de Mercancía" maxWidth="2xl">
            <div className="space-y-6 p-6">
                {/* Stepper Header */}
                <div className="relative flex items-center justify-between px-10">
                    <div className="absolute top-1/2 right-10 left-10 -z-10 h-0.5 -translate-y-1/2 bg-slate-100 dark:bg-slate-700"></div>
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= 1 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}
                    >
                        1
                    </div>
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= 2 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}
                    >
                        2
                    </div>
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= 3 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}
                    >
                        3
                    </div>
                </div>

                {/* Step 1: Account and Selector for Reference */}
                {step === 1 && (
                    <div className="space-y-4">
                        {isSuperAdmin && (
                            <SelectField
                                name="cuenta"
                                title="1. Selecciona la Cuenta"
                                item={{ idx: 'id', value: 'name' }}
                                lista={cuentas}
                                value={selectedCuenta}
                                onChange={(v) => setSelectedCuenta(v as string)}
                                error={''}
                            />
                        )}
                        <div className="space-y-3">
                            <SelectField
                                name="referencia_select"
                                title="2. Busca el Producto a Trasladar"
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
                                <div className="flex items-center gap-2 p-2 text-xs text-slate-400 italic">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando stock disponible...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Origin (Bodega -> Estantería -> Talla) */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                3. Selecciona el Origen de la Mercancía
                            </label>
                            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">
                                ← Cambiar producto
                            </Button>
                        </div>

                        <div className="grid grid-cols-[120px_1fr] gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <div 
                                className="flex h-[120px] w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
                                onClick={() => selectedRefData?.foto && openViewer(selectedRefData.foto)}
                            >
                                {selectedRefData?.foto ? (
                                    <img src={`/storage/${selectedRefData.foto}`} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-center text-[10px] text-slate-400">Sin foto</div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <SelectField
                                    name="originBodega"
                                    title="Bodega de Origen"
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
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                        {selectedOriginItem && (
                            <Button
                                className="h-12 w-full gap-2"
                                onClick={() => {
                                    setStep(3);
                                    if (!bodegasDestino.length) fetchBodegas(selectedCuenta || '');
                                }}
                            >
                                Siguiente: Seleccionar destino <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Step 3: Destination Selection */}
                {step === 3 && selectedOriginItem && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Vas a trasladar</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-mono">
                                        Talla {selectedOriginItem.talla}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                        desde{' '}
                                        <span className="font-bold">
                                            {selectedOriginItem.bodega_nombre} ({selectedOriginItem.estanteria_nombre})
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs" disabled={processing}>
                                ← Cambiar origen
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <SelectField
                                name="destBodega"
                                title="4. Bodega de Destino"
                                item={{ idx: 'id', value: 'nombre' }}
                                lista={bodegasDestino}
                                value={destBodega}
                                onChange={(v) => {
                                    setDestBodega(v as string);
                                    fetchEstanterias(v as string);
                                }}
                                disabled={processing}
                                error={''}
                            />
                            <SelectField
                                name="destEstanteria"
                                title="5. Estantería de Destino"
                                item={{ idx: 'id', value: 'nombre' }}
                                lista={estanteriasDestino}
                                value={destEstanteria}
                                onChange={(v) => setDestEstanteria(v as string)}
                                disabled={!destBodega || processing}
                                error={''}
                            />
                        </div>

                        <div className="flex flex-col items-center space-y-4 py-4">
                            <div className="w-full max-w-[200px]">
                                <InputField
                                    name="cantidad"
                                    title="6. Cantidad a Trasladar"
                                    type="number"
                                    min="1"
                                    max={selectedOriginItem.stock}
                                    value={cantidad}
                                    onChange={(v) => setCantidad(v)}
                                    className="h-14 text-center text-2xl font-bold"
                                    disabled={processing}
                                />
                                <p className="mt-1 text-center text-[10px] text-slate-400 uppercase">Máximo disponible: {selectedOriginItem.stock}</p>
                            </div>

                            <Button
                                size="lg"
                                className="text-md h-14 w-full gap-2 font-bold shadow-xl"
                                onClick={handleApplyTransfer}
                                disabled={processing || !destEstanteria || parseInt(cantidad) < 1 || parseInt(cantidad) > selectedOriginItem.stock}
                            >
                                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeftRight className="h-5 w-5" />}
                                {processing ? 'Procesando...' : 'Confirmar Traslado'}
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
