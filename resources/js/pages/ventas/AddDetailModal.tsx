import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { SelectField } from '@/components/ui/form/SelectField';
import { showAlert } from '@/plugins/sweetalert';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, Box, Image as ImageIcon, Minus, Plus, Search, Warehouse } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ViewerModal } from '@/components/ui/ViewerModal';

export const AddDetailModal = ({ isOpen, onClose, referencia, factura, bodegas, bodega_accesos, onAdded }: any) => {
    const { auth, time_restriction } = usePage().props as any;
    const { can_operate, is_holiday, schedule_today } = time_restriction || { can_operate: true, is_holiday: false, schedule_today: [] };

    const [mode, setMode] = useState<'search' | 'detail'>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedRef, setSelectedRef] = useState<any>(null);
    const [allStock, setAllStock] = useState<any[]>([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [saving, setSaving] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const [selectedBodegaId, setSelectedBodegaId] = useState<number | null>(null);
    const [selectedTalla, setSelectedTalla] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const loadingMore = useRef(false);

    const isLocal = auth.user?.role === 'local';
    const [isOutsideHours, setIsOutsideHours] = useState(false);

    useEffect(() => {
        const checkTime = () => {
            if (!isLocal || is_holiday) {
                setIsOutsideHours(is_holiday);
                return;
            }

            // Si el servidor dice que no podemos, confiamos inicialmente
            if (!can_operate) {
                setIsOutsideHours(true);
                return;
            }

            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const inRange = schedule_today.some((range: string[]) => {
                return currentTime >= range[0] && currentTime <= range[1];
            });

            setIsOutsideHours(!inRange);
        };
        checkTime();
        const timer = setInterval(checkTime, 60000);
        return () => clearInterval(timer);
    }, [isLocal, is_holiday, can_operate, schedule_today]);

    // Reset state when opening or prop change
    useEffect(() => {
        if (isOpen) {
            if (referencia) {
                handleSelectRef(referencia);
            } else {
                setMode('search');
                setSearchTerm('');
                setResults([]);
                setMeta(null);
                setSelectedRef(null);
                setQuantities({});
                setSelectedBodegaId(null);
                setSelectedTalla(null);
            }
        } else {
            setViewerImage(null);
        }
    }, [isOpen, referencia]);

    // Debounced search
    useEffect(() => {
        if (mode === 'search' && isOpen && !referencia) {
            const timeout = setTimeout(() => {
                searchRefs(1);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [searchTerm, selectedBodegaId, selectedTalla, mode, isOpen]);

    const searchRefs = async (page = 1) => {
        if (page > 1) loadingMore.current = true;
        setLoading(true);
        try {
            const response = await axios.get('/api/search-references', {
                params: {
                    search: searchTerm,
                    bodega_id: selectedBodegaId,
                    talla: selectedTalla,
                    page,
                },
            });
            if (page === 1) {
                setResults(response.data.data);
            } else {
                setResults((prev) => [...prev, ...response.data.data]);
            }
            setMeta(response.data.meta);
        } catch (error) {
            console.error('Error searching references:', error);
        } finally {
            setLoading(false);
            loadingMore.current = false;
        }
    };

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || loading || loadingMore.current || mode !== 'search') return;
        if (!meta || meta.current_page >= meta.last_page) return;
        const threshold = 100;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
            searchRefs(meta.current_page + 1);
        }
    }, [meta, loading, mode]);

    const permittedBodegaIds = useMemo(() => {
        if (!factura || !bodega_accesos) return new Set<number>();
        return new Set(bodega_accesos?.filter((a: any) => a.user_id === factura.local?.id && a.can_view).map((a: any) => a.bodega_id));
    }, [bodega_accesos, factura]);

    const fetchStock = async (ref: any) => {
        setLoadingStock(true);
        try {
            const response = await axios.get(`/api/muestras/stock`, {
                params: { referencia_id: ref.id },
            });
            setAllStock(response.data.data || []);
        } catch (error) {
            console.error('Error fetching stock:', error);
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

    const displayResults = useMemo(() => {
        return results
            .map((r: any) => {
                let breakdown = (r.stock_breakdown || []).filter((s: any) => permittedBodegaIds.has(parseInt(s.bodega_id)));

                if (selectedBodegaId) breakdown = breakdown.filter((s: any) => parseInt(s.bodega_id) === selectedBodegaId);
                if (selectedTalla) breakdown = breakdown.filter((s: any) => s.talla === selectedTalla);

                return {
                    ...r,
                    displayStock: breakdown.reduce((acc: number, curr: any) => acc + (parseInt(curr.total_stock) || 0), 0),
                    displayTallas: new Set(breakdown.map((s: any) => s.talla)).size,
                };
            })
            .filter((r: any) => r.displayStock > 0);
    }, [results, selectedBodegaId, selectedTalla, permittedBodegaIds]);
    const availableTallas = useMemo(() => {
        const set = new Set<string>();
        results?.forEach((r: any) => r.stock_breakdown?.forEach((s: any) => set.add(s.talla)));
        return Array.from(set).sort();
    }, [results]);

    // Price with discount helper
    const getAdjustedPrice = (price: number, bodegaId: number | null) => {
        if (!bodegaId) return price;
        const access = bodega_accesos?.find((a: any) => factura && a.bodega_id === bodegaId && a.user_id === factura.local?.id);
        const discount = Number(access?.descuento || 0);
        return Math.max(0, price - discount);
    };

    const handleQtyChange = (id: string, delta: number, max: number) => {
        setQuantities((prev) => {
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

        allStock.forEach((s) => {
            if (s.type === 'muestra') {
                if (!['admin', 'bodega', 'superadmin'].includes(auth.user.role)) return;

                if (!groups['muestras']) {
                    groups['muestras'] = {
                        id: 'muestras',
                        nombre: 'Muestras en Locales',
                        total_stock: 0,
                        items: [],
                        can_order: true,
                        is_muestra_group: true,
                    };
                }
                groups['muestras'].items.push({
                    ...s,
                    key: `m:${s.muestra_id}`,
                    precio_ajustado: s.precio_venta, // No discount for samples? Or same?
                });
                groups['muestras'].total_stock += 1;
                return;
            }

            if (!permittedBodegaIds.has(s.bodega_id)) return;

            const access = bodega_accesos?.find((a: any) => factura && a.bodega_id === s.bodega_id && a.user_id === factura.local?.id);

            if (!access) return;

            if (!groups[s.bodega_id]) {
                groups[s.bodega_id] = {
                    id: s.bodega_id,
                    nombre: s.bodega_nombre,
                    total_stock: 0,
                    items: [],
                    can_order: !!access.can_order,
                    descuento: Number(access.descuento || 0),
                };
            }

            groups[s.bodega_id].total_stock += s.stock;
            const adjustedPrice = Math.max(0, s.precio_venta - groups[s.bodega_id].descuento);

            groups[s.bodega_id].items.push({
                ...s,
                key: s.id.toString(),
                precio_ajustado: adjustedPrice,
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
                precio_unitario: finalPrice,
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
        <>
            <Modal
                show={isOpen}
            closeable={true}
            onClose={onClose}
            title={mode === 'search' ? 'Búsqueda por Referencia' : 'Seleccionar Detalle'}
            maxWidth="3xl"
            className="max-h-[95vh] overflow-y-auto"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}
                className="bg-background flex h-[80dvh] max-h-[700px] flex-col overflow-hidden"
            >
                {/* Header / Search Area */}
                <div className="bg-background space-y-4 border-b p-6">
                    {mode === 'search' ? (
                        <>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por código, marca o descripción..."
                                    className="bg-muted/50 border-border focus:ring-ring focus:border-ring text-foreground w-full rounded-xl border py-2.5 pr-4 pl-10 font-medium transition-all focus:ring-2 focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <SelectField
                                        name="bodega_id"
                                        title="Bodega"
                                        value={selectedBodegaId || ''}
                                        onChange={(val) => setSelectedBodegaId(val ? parseInt(val as string) : null)}
                                        lista={bodegas?.filter((b: any) => permittedBodegaIds.has(b.id)) || []}
                                        item={{ idx: 'id', value: 'nombre' }}
                                        placeholder="Todas las bodegas"
                                        error={undefined}
                                    />
                                </div>
                                <div className="flex-1">
                                    <SelectField
                                        name="talla"
                                        title="Talla"
                                        value={selectedTalla || ''}
                                        onChange={(val) => setSelectedTalla((val as string) || null)}
                                        lista={availableTallas}
                                        item="value"
                                        placeholder="Todas las tallas"
                                        error={undefined}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                    {selectedRef?.foto ? (
                                    <button
                                        type="button"
                                        onClick={() => setViewerImage(selectedRef.foto)}
                                        className="h-full w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]"
                                    >
                                        <img src={`/storage/${selectedRef.foto}`} alt="Product" className="h-full w-full object-cover" />
                                    </button>                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-slate-300" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground text-xl font-bold">{selectedRef?.codigo}</span>
                                        <Badge variant="outline" className="text-muted-foreground h-5 border px-2 text-[10px] font-bold uppercase">
                                            {typeof selectedRef?.marca === 'object' ? selectedRef.marca.nombre : selectedRef?.marca || 'N/A'}
                                        </Badge>
                                    </div>
                                    <h3 className="text-muted-foreground text-[13px] font-bold uppercase">{selectedRef?.descripcion}</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setMode('search')}
                                className="text-muted-foreground hover:text-foreground bg-muted/50 border-border flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors"
                            >
                                ← Volver
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
                    {mode === 'search' ? (
                        <div className="divide-y divide-slate-100 p-2">
                            {displayResults.map((r: any) => (
                                <button
                                    key={r.id}
                                    onClick={() => handleSelectRef(r)}
                                    className="group flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewerImage(r.foto);
                                            }}
                                            className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                        >
                                            {r.foto ? (
                                                <img src={`/storage/${r.foto}`} alt="Thumb" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-4 w-4 text-slate-300" />
                                            )}
                                        </button>
                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                                <span className="text-foreground flex-shrink-0 font-bold">{r.codigo}</span>
                                                <span className="text-foreground min-w-0 truncate font-medium uppercase">{r.descripcion}</span>
                                            </div>
                                            <div className="mt-1 flex gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className="border-border text-muted-foreground rounded-md px-1.5 py-0 text-[10px] font-medium"
                                                >
                                                    {typeof r.marca === 'object' ? r.marca.nombre : r.marca || 'GENERIC'}
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-muted text-muted-foreground rounded-md px-1.5 py-0 text-[10px] font-medium"
                                                >
                                                    {r.displayTallas} tallas
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Badge
                                            variant="secondary"
                                            className="bg-muted text-muted-foreground flex items-center gap-2 rounded-full border-none px-3 py-1 text-[10px] uppercase"
                                        >
                                            <Box className="h-3 w-3" />
                                            {r.displayStock} uds
                                        </Badge>
                                        ${Number(r.precio_venta || 0).toLocaleString()}
                                    </div>
                                </button>
                            ))}
                            {meta && meta.current_page < meta.last_page && (
                                <div className="flex justify-center py-4">
                                    <span className="text-muted-foreground text-xs italic">{loading ? 'Cargando...' : ''}</span>
                                </div>
                            )}
                            {displayResults.length === 0 && !loading && (
                                <div className="p-12 text-center text-slate-400">
                                    <Search className="mx-auto mb-3 h-12 w-12 opacity-20" />
                                    <p className="text-sm italic">No se encontraron referencias disponibles.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 p-6">
                            {loadingStock ? (
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-800" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {groupedStock.map((bodega) => (
                                        <div key={bodega.id} className="border-border bg-background overflow-hidden rounded-2xl border">
                                            <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
                                                <div className="text-foreground flex items-center gap-2">
                                                    <Warehouse className="text-muted-foreground h-3.5 w-3.5" />
                                                    <span className="text-[11px] font-bold uppercase">{bodega.nombre}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[11px]">{bodega.total_stock} uds disponibles</span>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {bodega.items.map((item: any) => {
                                                    const qty = quantities[item.key] || 0;
                                                    return (
                                                        <div
                                                            key={item.key}
                                                            className="hover:bg-muted/20 flex items-center justify-between p-4 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-6">
                                                                <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                                                                    <span className="text-foreground text-xs font-bold">{item.talla}</span>
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-foreground/80 text-sm font-bold">
                                                                            {item.is_muestra ? item.bodega_nombre : 'Stock en Bodega'}
                                                                        </span>
                                                                        {item.etiquetas && (
                                                                            <div className="flex gap-1">
                                                                                {item.etiquetas.map((t: string) => (
                                                                                    <Badge
                                                                                        key={t}
                                                                                        variant="outline"
                                                                                        className="border-border py-0 text-[9px]"
                                                                                    >
                                                                                        {t}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[12px]">
                                                                        <span>{item.stock} disp.</span>
                                                                        <span className="text-foreground border-border ml-1 border-l pl-2">
                                                                            ${Number(item.precio_ajustado || 0).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {bodega.can_order && (
                                                                <div className="bg-background border-border/50 flex items-center gap-3 rounded-xl border p-1.5 shadow-xs">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQtyChange(item.key, -1, item.stock)}
                                                                        className="hover:bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95"
                                                                    >
                                                                        <Minus className="h-4 w-4" />
                                                                    </button>
                                                                    <div className="text-foreground w-6 text-center text-sm font-medium">{qty}</div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQtyChange(item.key, 1, item.stock)}
                                                                        className="hover:bg-muted text-foreground flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition-all active:scale-95"
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
                <div className="bg-background border-t p-6">
                    {isOutsideHours && (
                        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                            <p className="text-xs font-medium text-amber-700">
                                {is_holiday
                                    ? 'Hoy es día festivo en Colombia. Los locales no pueden agregar productos.'
                                    : `Su local solo puede agregar productos en el horario: ${schedule_today.map((r: any) => `${r[0]} - ${r[1]}`).join(' y ')}.`}
                            </p>
                        </div>
                    )}
                    {mode === 'detail' ? (
                        <FormButtons
                            processing={saving}
                            reset={onClose}
                            buttons={{ cancel: true, submit: true }}
                            labels={{ cancel: 'Cancelar', submit: 'Agregar a factura' }}
                            submitDisabled={!canSubmit || isOutsideHours}
                        />
                    ) : (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-muted-foreground bg-muted/50 hover:bg-muted rounded-xl px-6 py-2.5 text-sm font-bold transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}
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
