import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';

type ThisForm = {
    local_id: string;
    referencia_id: string;
    inventario_id: string;
    variante: string;
    etiquetas: string[];
    cuenta_id: string;
};

export const Form = ({ id, cuentas, locals, onClose, processing, onStore, onGetItem, onReload }: any) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin';

    const [references, setReferences] = useState<any[]>([]);
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [selectedRef, setSelectedRef] = useState<any>(null);
    const [selectedInv, setSelectedInv] = useState<any>(null);
    const [loadingRefs, setLoadingRefs] = useState(false);
    const [loadingStock, setLoadingStock] = useState(false);

    const { data, setData, errors, reset, setError } = useForm<ThisForm>({
        local_id: '',
        referencia_id: '',
        inventario_id: '',
        variante: '',
        etiquetas: [],
        cuenta_id: isSuperAdmin ? '' : user?.cuenta_id?.toString() || '',
    });

    // Load existing item if editing
    useEffect(() => {
        if (id) {
            axios.get(route('api.muestras_crud.show', { muestras_crud: id })).then((res) => {
                const item = res.data;
                setData({
                    local_id: item.local.id.toString(),
                    referencia_id: item.referencia.id.toString(),
                    inventario_id: item.inventario_id?.toString() || '',
                    variante: item.variante,
                    etiquetas: item.etiquetas,
                    cuenta_id: item.cuenta.id.toString(),
                });
                // Need to trigger ref loading
            });
        }
    }, [id]);

    // Fetch references when account changes
    useEffect(() => {
        const fetchRefs = async () => {
            if (!data.cuenta_id) {
                setReferences([]);
                return;
            }
            setLoadingRefs(true);
            try {
                const res = await axios.get(route('api.muestras.references', { cuenta_id: data.cuenta_id }));
                setReferences(res.data);

                // If editing, find the selected ref
                if (data.referencia_id) {
                    const r = res.data.find((x: any) => x.id.toString() === data.referencia_id);
                    setSelectedRef(r);
                }
            } catch (error) {
                console.error(error);
                showAlert('error', 'No se pudieron cargar las referencias');
            } finally {
                setLoadingRefs(false);
            }
        };
        fetchRefs();
    }, [data.cuenta_id]);

    // Fetch stock when reference changes
    useEffect(() => {
        const fetchStock = async () => {
            if (!data.referencia_id) {
                setStockItems([]);
                return;
            }
            setLoadingStock(true);
            try {
                const res = await axios.get(route('api.muestras.stock', { referencia_id: data.referencia_id }));
                setStockItems(res.data.data);

                if (data.inventario_id) {
                    const inv = res.data.data.find((x: any) => x.id.toString() === data.inventario_id);
                    setSelectedInv(inv);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingStock(false);
            }
        };
        fetchStock();
    }, [data.referencia_id]);

    const handleRefChange = (refId: string) => {
        const ref = references.find((r) => r.id.toString() === refId);
        setSelectedRef(ref);
        setData((old) => ({
            ...old,
            referencia_id: refId,
            variante: '',
            inventario_id: '',
            etiquetas: [],
        }));
    };

    const handleInvChange = (invId: string) => {
        const inv = stockItems.find((i) => i.id.toString() === invId);
        setSelectedInv(inv);
        setData((old) => ({
            ...old,
            inventario_id: invId,
            variante: inv?.talla || '',
            etiquetas: [],
        }));
    };

    const toggleTag = (tag: string) => {
        const current = [...data.etiquetas];
        if (current.includes(tag)) {
            setData(
                'etiquetas',
                current.filter((t) => t !== tag),
            );
        } else {
            setData('etiquetas', [...current, tag]);
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        try {
            await onStore(
                () => ({ url: route('api.muestras_crud.store') }),
                () => ({ url: route('api.muestras_crud.update', { muestras_crud: id }) }),
                data,
                !!id, // isUpdate
                (err: any) => {
                    if (err.response?.data?.errors) {
                        const backendErrors = err.response.data.errors;
                        Object.keys(backendErrors).forEach((key: any) => {
                            setError(key as keyof ThisForm, backendErrors[key][0]);
                        });
                    }
                },
            );
            onReload();
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="pt-6 pb-12">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-6 text-slate-900 md:grid-cols-2">
                        <SelectField
                            name="local_id"
                            title="Local Destino"
                            required
                            value={data.local_id}
                            onChange={(val) => setData('local_id', val as string)}
                            lista={locals}
                            item={{ idx: 'id', value: 'name' }}
                            error={errors.local_id}
                        />

                        {isSuperAdmin && (
                            <SelectField
                                name="cuenta_id"
                                title="Cuenta / Empresa"
                                required
                                value={data.cuenta_id}
                                onChange={(val) => {
                                    setData((old) => ({
                                        ...old,
                                        cuenta_id: val as string,
                                        referencia_id: '',
                                        inventario_id: '',
                                        variante: '',
                                        etiquetas: [],
                                    }));
                                    setSelectedRef(null);
                                    setSelectedInv(null);
                                }}
                                lista={cuentas}
                                item={{ idx: 'id', value: 'nombre' }}
                                error={errors.cuenta_id}
                            />
                        )}

                        <SelectField
                            name="referencia_id"
                            title="Referencia"
                            required
                            disabled={!data.cuenta_id || loadingRefs}
                            value={data.referencia_id}
                            onChange={(val) => handleRefChange(val as string)}
                            lista={references.map((r) => ({ id: r.id.toString(), display: `${r.codigo} - ${r.descripcion}` }))}
                            item={{ idx: 'id', value: 'display' }}
                            error={errors.referencia_id}
                        />

                        {selectedRef && (
                            <SelectField
                                name="inventario_id"
                                title="Ubicación / Talla (Inventario)"
                                required
                                disabled={loadingStock}
                                value={data.inventario_id}
                                onChange={(val) => handleInvChange(val as string)}
                                lista={stockItems.map((i) => ({
                                    id: i.id.toString(),
                                    display: `Bodega: ${i.bodega_nombre} | Estante: ${i.estanteria_nombre} | Talla: ${i.talla} (Stock: ${i.stock})`,
                                }))}
                                item={{ idx: 'id', value: 'display' }}
                                error={errors.inventario_id}
                            />
                        )}
                    </div>

                    {selectedInv && selectedRef?.categoria?.subdivision_stock && (
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Seleccionar Partes / Etiquetas de Muestra</Label>
                                {selectedInv.subdivision_stock && (
                                    <div className="text-xs text-slate-500">
                                        Partes sueltas en inventario:{' '}
                                        {Object.entries(selectedInv.subdivision_stock)
                                            .filter(([_, qty]: any) => qty > 0)
                                            .map(([name, qty]) => `${name} (${qty})`)
                                            .join(', ') || 'Ninguna'}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                                {selectedRef.categoria.subdivision_stock.map((tag: string) => (
                                    <div key={tag} className="flex items-center space-x-2">
                                        <Checkbox id={`tag-${tag}`} checked={data.etiquetas.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                                        <Label htmlFor={`tag-${tag}`} className="unselectable flex cursor-pointer items-center gap-2 text-sm">
                                            {tag}
                                            {selectedInv.subdivision_stock?.[tag] > 0 && (
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-[10px] text-green-700">
                                                    Disponible suelto
                                                </Badge>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.etiquetas && <p className="text-sm text-red-600">{errors.etiquetas}</p>}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-end gap-4">
                        <FormButtons
                            processing={processing}
                            reset={() => onClose()}
                            buttons={{ cancel: true, submit: true }}
                            labels={{ cancel: 'Cancelar', submit: id ? 'Actualizar Muestra' : 'Registrar Muestra' }}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};
