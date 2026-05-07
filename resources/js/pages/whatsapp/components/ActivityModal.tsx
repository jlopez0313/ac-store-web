import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { Megaphone, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

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
    const [bodegas, setBodegas] = useState<any[]>([]);
    const [referencias, setReferencias] = useState<any[]>([]);
    const [whatsappGroups, setWhatsappGroups] = useState<any[]>([]);
    const [loadingBodegas, setLoadingBodegas] = useState(false);
    const [loadingReferencias, setLoadingReferencias] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [filterType, setFilterType] = useState<string>('groups');

    const [formData, setFormData] = useState({
        grupo_destino: [] as string[],
        cuenta_id: isSuperAdmin ? '' : userCuentaId,
        bodega_id: '',
        referencias: [] as string[],
        fecha: selectedDate,
        hora: '08:00'
    });
    const [timeError, setTimeError] = useState<string | null>(null);

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
            setFormData({
                grupo_destino: [],
                cuenta_id: isSuperAdmin ? '' : userCuentaId,
                bodega_id: '',
                referencias: [],
                fecha: selectedDate,
                hora: '08:00'
            });
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
        setFormData(prev => ({ ...prev, cuenta_id: cuentaId, bodega_id: '', referencias: [] }));
        fetchBodegas(cuentaId);
        fetchReferencias(cuentaId, '');
    };

    const handleBodegaChange = (val: string | string[]) => {
        const bodegaId = val as string;
        setFormData(prev => ({ ...prev, bodega_id: bodegaId, referencias: [] }));
        fetchReferencias(formData.cuenta_id as string, bodegaId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.grupo_destino.length === 0 || formData.referencias.length === 0) {
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
                for (const refId of formData.referencias) {
                    const refData = referencias.find(r => r.id === refId);
                    if (!refData) continue;

                    const formattedPrice = new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0
                    }).format(refData.precio);

                    const message = `*${refData.name}*\n` +
                        `📌 *Código:* ${refData.codigo}\n` +
                        `💰 *Precio:* ${formattedPrice}\n` +
                        `📏 *Tallas disponibles:* ${refData.tallas.join(', ')}`;

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
                        media: (refData.foto && typeof refData.foto === 'string') ? { url: refData.foto } : undefined,
                        scheduledTime: scheduledTime,
                        accountId: formData.cuenta_id,
                        referenceCode: refData.codigo
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
                        title="Referencias"
                        multiple={true}
                        placeholder="Seleccione referencias"
                        lista={referencias}
                        item={{ idx: 'id', value: 'name' }}
                        value={formData.referencias}
                        onChange={(val) => setFormData(prev => ({ ...prev, referencias: val as string[] }))}
                        error={undefined}
                        disabled={loadingReferencias}
                        isLoading={loadingReferencias}
                    />
                </div>

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
        </Modal>
    );
}
