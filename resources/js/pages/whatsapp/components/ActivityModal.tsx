import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Megaphone, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

interface SelectedItem {
    id: string;
    name: string;
    codigo: string;
    precio: number;
    foto: string;
    tallas: string[];
    percentage: number;
    descuento?: number;
}

interface ActivityModalProps {
    show: boolean;
    onClose: () => void;
    selectedDate: string;
    isSuperAdmin: boolean;
    cuentas: any[];
    userId: number;
    userCuentaId: string | null;
    apiUrl: string;
    status: string;
}

export function ActivityModal({
    show,
    onClose,
    selectedDate,
    isSuperAdmin,
    cuentas,
    userId,
    userCuentaId,
    apiUrl,
    status
}: ActivityModalProps) {
    const { auth }: any = usePage().props;
    const isLocal = auth.user.role === 'local';

    const [bodegas, setBodegas] = useState<any[]>([]);
    const [referencias, setReferencias] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [whatsappGroups, setWhatsappGroups] = useState<any[]>([]);
    const [loadingBodegas, setLoadingBodegas] = useState(false);
    const [loadingReferencias, setLoadingReferencias] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [filterType, setFilterType] = useState<string>('groups');

    const [formData, setFormData] = useState({
        grupo_destino: [] as string[],
        cuenta_id: isSuperAdmin ? '' : userCuentaId,
        bodega_id: '',
        fecha: selectedDate,
        hora: '08:00'
    });
    const [timeError, setTimeError] = useState<string | null>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const validateTime = (fecha: string, hora: string) => {
        if (!fecha || !hora) return;
        const [year, month, day] = fecha.split('-').map(Number);
        const [hour, minute] = hora.split(':').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute);
        const now = new Date();
        const minAllowedDate = new Date(now.getTime() + 2 * 60 * 1000);

        if (scheduledDate < minAllowedDate) {
            setTimeError('La hora debe ser al menos 2 minutos posterior a la actual.');
        } else {
            setTimeError(null);
        }
    };

    useEffect(() => {
        validateTime(formData.fecha, formData.hora);
    }, [formData.fecha, formData.hora]);

    useEffect(() => {
        if (show) {
            let initialFecha = selectedDate;
            let initialHora = '08:00';

            // If selectedDate comes from a time-grid (Week/Day view), it looks like "2023-10-25T14:30:00"
            if (selectedDate && selectedDate.includes('T')) {
                const parts = selectedDate.split('T');
                initialFecha = parts[0];
                initialHora = parts[1].substring(0, 5); // Get "HH:mm"
            } else if (selectedDate) {
                // If it's today, let's set a default time slightly in the future instead of 08:00 if it's already past 08:00
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                if (selectedDate === todayStr) {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 5);
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    initialHora = `${hours}:${minutes}`;
                }
            }

            setFormData({
                grupo_destino: [],
                cuenta_id: isSuperAdmin ? '' : userCuentaId,
                bodega_id: '',
                fecha: initialFecha,
                hora: initialHora
            });
            setSelectedItems([]);
            setFilterType('groups');
            setTimeError(null);
        }
    }, [show, selectedDate, isSuperAdmin, userCuentaId]);

    const fetchBodegas = useCallback(async (cuentaId: string) => {
        if (!cuentaId) {
            setBodegas([]);
            return;
        }
        setLoadingBodegas(true);
        try {
            const response = await axios.get(route('api.bodegas.list'), { params: { cuenta_id: cuentaId } });
            setBodegas(response.data);
        } catch (error) {
            console.error('Error fetching bodegas:', error);
        } finally {
            setLoadingBodegas(false);
        }
    }, []);

    const fetchReferencias = useCallback(async (cuentaId: string, bodegaId: string) => {
        if (!cuentaId) {
            setReferencias([]);
            return;
        }
        setLoadingReferencias(true);
        try {
            const response = await axios.get(route('api.referencias.list'), {
                params: {
                    cuenta_id: cuentaId,
                    bodega_id: bodegaId
                }
            });
            setReferencias(response.data);
        } catch (error) {
            console.error('Error fetching referencias:', error);
        } finally {
            setLoadingReferencias(false);
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        if (status !== 'connected') return;
        setLoadingGroups(true);
        try {
            const response = await axios.get(`${apiUrl}/${userId}/groups`);
            const groups = Array.isArray(response.data) ? response.data : (response.data.groups || []);
            const sortedGroups = groups.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setWhatsappGroups(sortedGroups);
        } catch (error) {
            console.error('Error fetching WhatsApp groups:', error);
        } finally {
            setLoadingGroups(false);
        }
    }, [status, apiUrl, userId]);

    const filteredGroups = useMemo(() => {
        return whatsappGroups.filter(g => {
            if (filterType === 'announcements') return g.isReadOnly;
            return !g.isReadOnly;
        });
    }, [whatsappGroups, filterType]);

    useEffect(() => {
        if (show && status === 'connected') {
            fetchGroups();
        }
    }, [show, status, fetchGroups]);

    useEffect(() => {
        if (show && !isSuperAdmin && userCuentaId) {
            fetchBodegas(userCuentaId);
            fetchReferencias(userCuentaId, '');
        }
    }, [show, isSuperAdmin, userCuentaId, fetchBodegas, fetchReferencias]);

    const handleCuentaChange = (val: string | string[]) => {
        const cuentaId = val as string;
        setFormData(prev => ({ ...prev, cuenta_id: cuentaId, bodega_id: '' }));
        fetchBodegas(cuentaId);
        fetchReferencias(cuentaId, '');
    };

    const handleBodegaChange = (val: string | string[]) => {
        const bodegaId = val as string;
        setFormData(prev => ({ ...prev, bodega_id: bodegaId }));
        fetchReferencias(formData.cuenta_id as string, bodegaId);
    };

    const handleAddItem = (refId: string) => {
        const ref = referencias.find(r => r.id === refId);
        if (!ref) return;

        if (selectedItems.find(item => item.id === ref.id)) {
            return; // Already added
        }

        setSelectedItems(prev => [...prev, {
            id: ref.id,
            name: ref.name,
            codigo: ref.codigo,
            precio: ref.precio,
            foto: ref.foto,
            tallas: ref.tallas,
            percentage: 0,
            descuento: ref.descuento || 0
        }]);
    };

    const handleRemoveItem = (id: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdatePercentage = (id: string, percentage: number) => {
        setSelectedItems(prev => prev.map(item =>
            item.id === id ? { ...item, percentage } : item
        ));
    };

    const handleUpdateFinalPrice = (id: string, finalPrice: number) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                // percentage = ((finalPrice / basePrice) - 1) * 100
                const percentage = item.precio > 0 ? ((finalPrice / item.precio) - 1) * 100 : 0;
                return { ...item, percentage: Math.round(percentage * 100) / 100 };
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.grupo_destino.length === 0 || selectedItems.length === 0) {
            Swal.fire('Error', 'Debe seleccionar al menos un destino y una referencia.', 'error');
            return;
        }

        if (timeError) return;

        // Only send if connected
        if (status !== 'connected') {
            Swal.fire('Error', 'WhatsApp no está conectado.', 'error');
            return;
        }

        Swal.fire({
            title: 'Enviando mensajes...',
            text: 'Por favor espere mientras se procesan los envíos.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            for (const grupoId of formData.grupo_destino) {
                for (const item of selectedItems) {
                    const finalPrice = item.precio * (1 + (item.percentage / 100));
                    const priceToDisplay = isLocal ? finalPrice : item.precio;

                    const formattedPrice = new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0
                    }).format(priceToDisplay);

                    const message = `*${item.name}*\n` +
                        `📌 *Código:* ${item.codigo}\n` +
                        `💰 *Precio:* ${formattedPrice}\n` +
                        `📏 *Tallas disponibles:* ${item.tallas.join(', ')}`;

                    const [year, month, day] = formData.fecha.split('-').map(Number);
                    const [hour, minute] = formData.hora.split(':').map(Number);
                    const localDate = new Date(year, month - 1, day, hour, minute);

                    if (isNaN(localDate.getTime())) {
                        throw new Error('Fecha u hora inválida');
                    }

                    const scheduledTime = localDate.toISOString();

                    await axios.post(route('api.scheduled.store'), {
                        userId: userId,
                        to: grupoId,
                        message: message,
                        media: (item.foto && typeof item.foto === 'string') ? { url: item.foto } : undefined,
                        scheduledTime: scheduledTime,
                        accountId: formData.cuenta_id,
                        referenceCode: item.codigo
                    });
                }
            }

            Swal.fire({
                title: '¡Éxito!',
                text: 'Actividades programadas correctamente.',
                icon: 'success',
                confirmButtonColor: '#10b981'
            });
            onClose();
        } catch (error) {
            console.error('Error sending messages:', error);
            Swal.fire('Error', 'Hubo un problema al enviar algunos mensajes.', 'error');
        }
    };

    const grupoDestinoOptions = [
        { id: 'clientes', name: 'Clientes' },
        { id: 'proveedores', name: 'Proveedores' },
        { id: 'vendedores', name: 'Vendedores' },
        { id: 'otros', name: 'Otros' },
    ];

    return (
        <Modal closeable show={show} onClose={onClose} title={`Programar para: ${selectedDate}`} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="fecha">Fecha de Programación</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={formData.fecha}
                            onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hora" className={timeError ? 'text-red-500' : ''}>Hora de Envío</Label>
                        <Input
                            id="hora"
                            type="time"
                            value={formData.hora}
                            onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                            className={timeError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            required
                        />
                        {timeError && (
                            <p className="text-xs text-red-500 font-medium animate-pulse">{timeError}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {status === 'connected' && (
                        <div className="space-y-2">
                            <Label>Tipo de Destino</Label>
                            <Tabs value={filterType} onValueChange={setFilterType} className="w-full mt-2">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="groups" className="gap-2">
                                        <Users className="h-4 w-4" />
                                        Grupos
                                    </TabsTrigger>
                                    <TabsTrigger value="announcements" className="gap-2">
                                        <Megaphone className="h-4 w-4" />
                                        Anuncios
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}

                    <SelectField
                        name="grupo_destino"
                        title="Grupo Destino"
                        multiple={true}
                        placeholder="Seleccione uno o varios"
                        lista={status === 'connected' ? filteredGroups : grupoDestinoOptions}
                        item={{ idx: 'id', value: 'name' }}
                        value={formData.grupo_destino}
                        onChange={(val) => setFormData(prev => ({ ...prev, grupo_destino: val as string[] }))}
                        error={undefined}
                        required
                        isLoading={loadingGroups}
                    />

                    {isSuperAdmin && (
                        <SelectField
                            name="cuenta_id"
                            title="Cuenta / Empresa"
                            placeholder="Seleccione una cuenta"
                            lista={cuentas}
                            item={{ idx: 'id', value: 'nombre' }}
                            value={formData.cuenta_id as string}
                            onChange={handleCuentaChange}
                            error={undefined}
                            required
                        />
                    )}

                    <SelectField
                        name="bodega_id"
                        title="Bodega"
                        placeholder="Seleccione bodega (opcional)"
                        lista={bodegas}
                        item={{ idx: 'id', value: 'name' }}
                        value={formData.bodega_id}
                        onChange={handleBodegaChange}
                        error={undefined}
                        disabled={loadingBodegas}
                        isLoading={loadingBodegas}
                    />

                    <SelectField
                        name="referencias"
                        title="Seleccionar Referencias"
                        placeholder="Buscar y agregar..."
                        lista={referencias}
                        item={{ idx: 'id', value: 'name' }}
                        value=""
                        onChange={(val) => handleAddItem(val as string)}
                        error={undefined}
                        disabled={loadingReferencias}
                        isLoading={loadingReferencias}
                    />
                </div>

                {selectedItems.length > 0 && (
                    <div className="space-y-4 border rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-900/30">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Productos Seleccionados ({selectedItems.length})
                            </span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader className="border-b">
                                    <TableRow>
                                        <TableHead className="w-[85px]">Foto</TableHead>
                                        <TableHead>Referencia</TableHead>
                                        <TableHead className="text-right">Precio Base</TableHead>
                                        {isLocal && (
                                            <>
                                                <TableHead className="w-32 text-center">% Incremento</TableHead>
                                                <TableHead className="w-40 text-right">Precio Final</TableHead>
                                            </>
                                        )}
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedItems.map((item) => (
                                        <TableRow key={item.id} className="bg-white dark:bg-slate-950 group">
                                            <TableCell>
                                                <div
                                                    onClick={() => item.foto && setViewerImage(item.foto)}
                                                    className={`h-10 w-10 rounded-md border overflow-hidden bg-slate-100 ${item.foto ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                                                >
                                                    {item.foto ? (
                                                        <img src={item.foto} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Megaphone className="h-4 w-4 m-auto mt-3 text-slate-300" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-slate-900 dark:text-slate-100">{item.codigo}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.name}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                <div className="flex flex-col items-end">
                                                    <span>${item.precio.toLocaleString()}</span>
                                                    {isLocal && item.descuento && item.descuento > 0 && (
                                                        <Badge className="mt-1 bg-emerald-500 hover:bg-emerald-600 text-[9px] h-4 px-1.5 border-none">
                                                            -{item.descuento.toLocaleString()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {isLocal && (
                                                <>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={item.percentage}
                                                            onChange={(e) => handleUpdatePercentage(item.id, Number(e.target.value))}
                                                            className="h-8 text-center text-xs font-bold border-indigo-200 focus-visible:ring-indigo-500"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400">$</span>
                                                            <Input
                                                                type="number"
                                                                value={Math.round(item.precio * (1 + (item.percentage / 100)))}
                                                                onChange={(e) => handleUpdateFinalPrice(item.id, Number(e.target.value))}
                                                                className="h-8 pl-5 text-right text-xs font-bold border-indigo-200 text-indigo-600 focus-visible:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={!!timeError}
                        loading={loadingGroups || loadingBodegas || loadingReferencias}
                    >
                        Guardar Actividad
                    </Button>
                </div>
            </form>
            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={() => setViewerImage(null)}
            />
        </Modal>
    );
}
