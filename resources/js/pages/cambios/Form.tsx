import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    Check,
    Search,
    Image as ImageIcon
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

export const Form = ({ cuentas, current_cuenta, locals, onClose, onStore, onReload }: any) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin';

    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [searchRef, setSearchRef] = useState('');
    const [selectedLocal, setSelectedLocal] = useState(isSuperAdmin ? 'ALL' : user?.id?.toString() || 'ALL');
    const [soldItems, setSoldItems] = useState<any[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [changeType, setChangeType] = useState('reference'); // 'size' or 'reference'

    // For step 2 (Replacement)
    const [references, setReferences] = useState<any[]>([]);
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [selectedBodegaId, setSelectedBodegaId] = useState<string>('');
    const [selectedTalla, setSelectedTalla] = useState<string>('');
    const [localAccesos, setLocalAccesos] = useState<any[]>([]);

    const { data, setData, errors, processing } = useForm({
        venta_detalle_id: '',
        nuevo_producto_id: '',
        nuevo_inventario_id: '',
        precio_nuevo: 0,
        cuenta_id: isSuperAdmin ? '' : user?.cuenta_id?.toString() || '',
        talla_nueva: '',
        observacion: '',
    });

    const selectedItem = useMemo(() => {
        return soldItems.find(i => i.id.toString() === selectedItemId);
    }, [selectedItemId, soldItems]);

    const getPriceHighlight = (precio: number, sugerido: number, descuento: number) => {
        const baseConDescuento = sugerido - (sugerido * (descuento / 100));
        
        // Intensity increased for "colorcito"
        if (descuento > 0 && Math.abs(precio - baseConDescuento) < 1)
            return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700';
            
        if (precio === sugerido || sugerido === 0) return 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600';
        
        if (precio < baseConDescuento) return 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700';
        
        return 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600';
    };

    const handleSearch = async () => {
        if (!searchRef) return;
        setLoading(prev => ({ ...prev, search: true }));
        try {
            const res = await axios.get(route('api.cambios.search_sold_items', {
                referencia: searchRef,
                local_id: selectedLocal,
                cuenta_id: data.cuenta_id
            }));
            setSoldItems(res.data.data);
            if (res.data.data.length === 0) {
                showAlert('info', 'No se encontraron productos vendidos con esa referencia en el periodo permitido.');
            }
        } catch (error) {
            showAlert('error', 'Error al buscar productos');
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    const fetchStock = async (refId: string) => {
        if (!refId) return;
        setLoading(prev => ({ ...prev, stock: true }));
        try {
            const res = await axios.get(route('api.muestras.stock', { 
                referencia_id: refId,
                local_id: selectedLocal !== 'ALL' ? selectedLocal : null
            }));
            const items = res.data.data;
            setStockItems(items);
            setSelectedTalla('');
            if (items.length > 0) {
                setData('precio_nuevo', Number(items[0].precio_venta));
            }
        } catch (error) {
            showAlert('error', 'Error al cargar stock');
        } finally {
            setLoading(prev => ({ ...prev, stock: false }));
        }
    };

    const fetchReferences = async () => {
        setLoading(prev => ({ ...prev, refs: true }));
        try {
            const res = await axios.get(route('api.muestras.references', { cuenta_id: data.cuenta_id }));
            setReferences(res.data);
        } catch (error) {
            showAlert('error', 'Error al cargar productos');
        } finally {
            setLoading(prev => ({ ...prev, refs: false }));
        }
    };

    useEffect(() => {
        if (data.cuenta_id) {
            fetchReferences();
        }
    }, [data.cuenta_id]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!selectedItemId) {
            showAlert('warning', 'Debe seleccionar un producto de la tabla');
            return;
        }
        setLoading(prev => ({ ...prev, storing: true }));
        try {
            await onStore({ 
                ...data, 
                venta_detalle_id: selectedItemId,
                venta_id: selectedItem?.venta_id
            });
            showAlert('success', 'Cambio procesado exitosamente');
            onReload();
            onClose();
        } catch (error: any) {
            showAlert('error', error.response?.data?.error || 'Error al procesar el cambio');
        } finally {
            setLoading(prev => ({ ...prev, storing: false }));
        }
    };

    useEffect(() => {
        if (searchRef.length === 0) {
            setSoldItems([]);
            return;
        }
        if (searchRef.length >= 2) {
            const timeoutId = setTimeout(() => {
                handleSearch();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [searchRef, selectedLocal, data.cuenta_id]);

    useEffect(() => {
        if (selectedItemId) {
            const item = soldItems.find(i => i.id.toString() === selectedItemId);
            if (item) {
                setData(old => ({
                    ...old,
                    nuevo_producto_id: item.producto_id,
                    // We'll update precio_nuevo once stock is fetched to get the current reference price
                }));
                fetchStock(item.producto_id);
            }
        }
    }, [selectedItemId]);

    const diasCambio = data.cuenta_id 
        ? (cuentas.find((c: any) => c.id.toString() === data.cuenta_id)?.dias_cambio ?? 15)
        : (current_cuenta?.dias_cambio ?? 15);

    return (
        <div className="flex flex-col bg-slate-50/30 dark:bg-slate-900/30">
            <form onSubmit={submit} className="p-6 space-y-8">
                {/* 1. BUSCAR PRODUCTO VENDIDO */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        1. BUSCAR PRODUCTO VENDIDO
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className={isSuperAdmin ? 'md:col-span-3' : 'md:col-span-4'}>
                            <SelectField
                                name="local_id"
                                title="Local"
                                value={selectedLocal}
                                onChange={(val) => {
                                    const localId = val as string;
                                    setSelectedLocal(localId);
                                    if (localId !== 'ALL') {
                                        const local = locals.find((l: any) => l.id.toString() === localId);
                                        if (local && local.cuenta_id) {
                                            setData('cuenta_id', local.cuenta_id.toString());
                                        }
                                    }
                                }}
                                lista={[{ id: 'ALL', name: 'Todos los locales' }, ...(isSuperAdmin && data.cuenta_id ? locals.filter((l: any) => l.cuenta_id == data.cuenta_id) : locals)]}
                                item={{ idx: 'id', value: 'name' }}
                            />
                        </div>
                                                
                        {isSuperAdmin && (
                            <div className="md:col-span-3">
                                <SelectField
                                    name="cuenta_id"
                                    title="Cuenta"
                                    value={data.cuenta_id}
                                    onChange={(val) => {
                                        const newCuentaId = val as string;
                                        setData('cuenta_id', newCuentaId);
                                        
                                        // Si el local actual no pertenece a la nueva cuenta, lo reseteamos
                                        const currentLocal = locals.find((l: any) => l.id.toString() === selectedLocal);
                                        if (currentLocal && currentLocal.cuenta_id?.toString() !== newCuentaId) {
                                            setSelectedLocal('ALL');
                                        }
                                        
                                        setSoldItems([]);
                                    }}
                                    lista={cuentas}
                                    item={{ idx: 'id', value: 'nombre' }}
                                />
                            </div>
                        )}

                        <div className={isSuperAdmin ? 'md:col-span-4' : 'md:col-span-5'}>
                            <SelectField
                                name="searchRef"
                                title="Referencia Vendida"
                                value={searchRef}
                                onChange={(val) => setSearchRef(val as string)}
                                lista={references.map(r => ({ id: r.codigo, label: `${r.codigo} - ${r.descripcion}` }))}
                                item={{ idx: 'id', value: 'label' }}
                            />
                        </div>
                    </div>

                    <div className="border rounded-xl bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="w-[60px] px-4 py-3 font-bold text-slate-400 text-[10px] uppercase">Foto</th>
                                    <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase">Factura</th>
                                    <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase">Fecha</th>
                                    <th className="px-4 py-3 font-bold text-center text-slate-400 text-[10px] uppercase">Días</th>
                                    <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase">Talla</th>
                                    <th className="px-4 py-3 font-bold text-right text-slate-400 text-[10px] uppercase">Precio</th>
                                    <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase">Local</th>
                                </tr>
                            </thead>
                            <tbody>
                                {soldItems.map(item => {
                                    const highlight = getPriceHighlight(Number(item.precio), Number(item.precio_sugerido || 0), Number(item.descuento || 0));
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedItemId(item.id.toString())}
                                            className={`cursor-pointer transition-colors ${selectedItemId === item.id.toString() ? 'bg-amber-50/80 dark:bg-amber-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <td className="px-4 py-2">
                                                <div className={`h-10 w-10 rounded-lg border overflow-hidden flex items-center justify-center ${highlight}`}>
                                                    {item.producto.foto ? (
                                                        <img src={item.producto.foto} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="h-4 w-4 text-slate-300" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selectedItemId === item.id.toString() ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                                        {selectedItemId === item.id.toString() && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <span className="font-bold">{item.venta_numero}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{item.fecha}</td>
                                            <td className="px-4 py-3 text-center">{Math.floor(item.dias)}</td>
                                            <td className="px-4 py-3 font-bold">{item.talla}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-1 rounded-md border font-bold shadow-sm ${highlight}`}>
                                                    ${Number(item.precio).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs uppercase">{item.local}</td>
                                        </tr>
                                    );
                                })}

                                {soldItems.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                            {loading.search ? 'Buscando...' : 'No hay resultados. Ingresa una referencia y haz clic en buscar.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. PRODUCTO A CAMBIAR */}
                {selectedItemId && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            2. PRODUCTO A CAMBIAR
                        </h3>

                        <Tabs defaultValue="size" className="w-full" onValueChange={(val) => {
                            setChangeType(val);
                            setSelectedTalla('');
                            setData(old => ({
                                ...old,
                                nuevo_producto_id: val === 'size' && selectedItem ? selectedItem.producto_id : '',
                                nuevo_inventario_id: '',
                                precio_nuevo: 0,
                                talla_nueva: '',
                                observacion: '',
                            }));
                            
                            if (val === 'size' && selectedItem) {
                                fetchStock(selectedItem.producto_id);
                            } else {
                                setStockItems([]);
                            }
                        }}>
                            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
                                <TabsTrigger value="size" className="flex-1 font-bold text-xs uppercase py-2">Cambio por talla</TabsTrigger>
                                <TabsTrigger value="reference" className="flex-1 font-bold text-xs uppercase py-2">Cambio por referencia</TabsTrigger>
                            </TabsList>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border dark:bg-slate-900 dark:border-slate-700">
                                <div className="space-y-6">
                                    <TabsContent value="size" className="mt-0 space-y-4">
                                        <p className="text-xs text-slate-500">Selecciona la nueva talla para la referencia <span className="font-bold">{selectedItem?.producto.codigo}</span></p>
                                        
                                        {loading.stock ? (
                                            <p className="text-xs text-indigo-600 animate-pulse">Cargando stock...</p>
                                        ) : (
                                            <>
                                                <SelectField
                                                    name="selectedTalla"
                                                    title="1. Seleccionar Talla"
                                                    value={selectedTalla}
                                                    onChange={(val) => {
                                                        const talla = val as string;
                                                        setSelectedTalla(talla);
                                                        setData('nuevo_inventario_id', ''); // Reset selected inventory
                                                        
                                                        // Auto-select if only one bodega has this size
                                                        const available = stockItems.filter(i => i.talla === talla);
                                                        if (available.length === 1) {
                                                            const item = available[0];
                                                            setData(old => ({ ...old, nuevo_inventario_id: item.id.toString(), talla_nueva: item.talla, precio_nuevo: item.precio_venta }));
                                                        }
                                                    }}
                                                    lista={[...new Set(stockItems.map(i => i.talla))].map(t => ({ id: t, name: `Talla ${t}` }))}
                                                    item={{ idx: 'id', value: 'name' }}
                                                />

                                                {selectedTalla && (
                                                    <SelectField
                                                        name="nuevo_inventario_id"
                                                        title="2. Seleccionar Bodega"
                                                        value={data.nuevo_inventario_id}
                                                        onChange={(val) => {
                                                            const sel = stockItems.find(i => i.id.toString() === val);
                                                            setData(old => ({ ...old, nuevo_inventario_id: val as string, talla_nueva: sel?.talla, precio_nuevo: sel?.precio_venta }));
                                                        }}
                                                        lista={stockItems.filter(i => i.talla === selectedTalla).map(i => ({
                                                            id: i.id.toString(),
                                                            label: `${i.bodega_nombre} | Stock: ${i.stock} | $${Number(i.precio_venta).toLocaleString()} ${i.descuento > 0 ? `(Dto. ${i.descuento}%)` : ''}`
                                                        }))}
                                                        item={{ idx: 'id', value: 'label' }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="reference" className="mt-0 space-y-4">
                                        <SelectField
                                            name="nuevo_producto_id"
                                            title="Buscar nueva referencia"
                                            value={data.nuevo_producto_id}
                                            onChange={(val) => {
                                                setData('nuevo_producto_id', val as string);
                                                fetchStock(val as string);
                                                setSelectedTalla('');
                                            }}
                                            lista={references.map(r => ({ id: r.id.toString(), label: `${r.codigo} - ${r.descripcion}` }))}
                                            item={{ idx: 'id', value: 'label' }}
                                        />

                                        {data.nuevo_producto_id && !loading.stock && (
                                            <>
                                                <SelectField
                                                    name="selectedTalla"
                                                    title="1. Seleccionar Talla"
                                                    value={selectedTalla}
                                                    onChange={(val) => {
                                                        const talla = val as string;
                                                        setSelectedTalla(talla);
                                                        setData('nuevo_inventario_id', '');
                                                        
                                                        const available = stockItems.filter(i => i.talla === talla);
                                                        if (available.length === 1) {
                                                            const item = available[0];
                                                            setData(old => ({ ...old, nuevo_inventario_id: item.id.toString(), talla_nueva: item.talla, precio_nuevo: item.precio_venta }));
                                                        }
                                                    }}
                                                    lista={[...new Set(stockItems.map(i => i.talla))].map(t => ({ id: t, name: `Talla ${t}` }))}
                                                    item={{ idx: 'id', value: 'name' }}
                                                />

                                                {selectedTalla && (
                                                    <SelectField
                                                        name="nuevo_inventario_id"
                                                        title="2. Seleccionar Bodega"
                                                        value={data.nuevo_inventario_id}
                                                        onChange={(val) => {
                                                            const sel = stockItems.find(i => i.id.toString() === val);
                                                            setData(old => ({ ...old, nuevo_inventario_id: val as string, talla_nueva: sel?.talla, precio_nuevo: sel?.precio_venta }));
                                                        }}
                                                        lista={stockItems.filter(i => i.talla === selectedTalla).map(i => ({
                                                            id: i.id.toString(),
                                                            label: `${i.bodega_nombre} | Stock: ${i.stock} | $${Number(i.precio_venta).toLocaleString()} ${i.descuento > 0 ? `(Dto. ${i.descuento}%)` : ''}`
                                                        }))}
                                                        item={{ idx: 'id', value: 'label' }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </TabsContent>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-6 border border-dashed dark:bg-slate-800/50 flex flex-col justify-between">
                                    {data.nuevo_inventario_id && stockItems.find(i => i.id.toString() === data.nuevo_inventario_id) ? (
                                        <div className="mb-4 flex items-center gap-4 p-3 bg-white rounded-xl border shadow-sm dark:bg-slate-800 dark:border-slate-700">
                                            <div className="h-16 w-16 rounded-lg border overflow-hidden bg-slate-100 flex items-center justify-center">
                                                {stockItems.find(i => i.id.toString() === data.nuevo_inventario_id)?.referencia_foto ? (
                                                    <img src={stockItems.find(i => i.id.toString() === data.nuevo_inventario_id).referencia_foto} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Nuevo Producto</span>
                                                <span className="text-sm font-bold truncate">
                                                    {(() => {
                                                        const inv = stockItems.find(i => i.id.toString() === data.nuevo_inventario_id);
                                                        const ref = references.find(r => r.id.toString() === data.nuevo_producto_id);
                                                        return ref ? `${ref.codigo} - ${ref.descripcion}` : (selectedItem?.producto.codigo || 'Cargando...');
                                                    })()}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                        Talla {stockItems.find(i => i.id.toString() === data.nuevo_inventario_id)?.talla}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold truncate">
                                                        {stockItems.find(i => i.id.toString() === data.nuevo_inventario_id)?.bodega_nombre}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase">Valor Venta Sugerido</Label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className={`w-full border rounded-lg p-2.5 font-bold transition-colors ${getPriceHighlight(data.precio_nuevo, Number(stockItems.find(i => i.id.toString() === data.nuevo_inventario_id)?.precio_base || 0), Number(stockItems.find(i => i.id.toString() === data.nuevo_inventario_id)?.descuento || 0)) || 'bg-white'}`}
                                                    value={data.precio_nuevo}
                                                    onChange={(e) => setData('precio_nuevo', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase">Observación</Label>
                                            <textarea
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm min-h-[80px] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                                                placeholder="Motivo del cambio..."
                                                value={data.observacion}
                                                onChange={(e) => setData('observacion', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t mt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Diferencia</span>
                                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                                ${(data.precio_nuevo - (selectedItem?.precio || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold"
                                            disabled={processing || !data.nuevo_inventario_id || !data.observacion}
                                        >
                                            {processing ? 'Procesando...' : 'PROCESAR CAMBIO'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Tabs>
                    </div>
                )}
            </form>

            <div className="px-6 py-4 border-t bg-white dark:bg-slate-900 flex justify-end">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
            </div>
        </div>
    );
};
