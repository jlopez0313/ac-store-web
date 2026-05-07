import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Megaphone, Trash, Users } from 'lucide-react';

interface EditActivityModalProps {
    show: boolean;
    onClose: () => void;
    event: any | null;
    userId: number;
    apiUrl: string;
    status: string;
}

export function EditActivityModal({
    show,
    onClose,
    event,
    userId,
    apiUrl,
    status
}: EditActivityModalProps) {
    const [whatsappGroups, setWhatsappGroups] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<string>('groups');

    const [formData, setFormData] = useState({
        to: '',
        message: '',
        fecha: '',
        hora: ''
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

    const [mediaParsed, setMediaParsed] = useState<any>(null);

    useEffect(() => {
        if (show && event && event.extendedProps) {
            const dateObj = new Date(event.start);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');

            setFormData({
                to: event.extendedProps.recipient || event.extendedProps.to || '',
                message: event.extendedProps.message || '',
                fecha: `${yyyy}-${mm}-${dd}`,
                hora: `${hh}:${min}`
            });
            setTimeError(null);

            if (event.extendedProps.media) {
                if (typeof event.extendedProps.media === 'string') {
                    try {
                        setMediaParsed(JSON.parse(event.extendedProps.media));
                    } catch(e) {
                        setMediaParsed(null);
                    }
                } else {
                    setMediaParsed(event.extendedProps.media);
                }
            } else {
                setMediaParsed(null);
            }
        }
    }, [show, event]);

    const fetchGroups = useCallback(async () => {
        if (status !== 'connected') return;
        setLoadingGroups(true);
        try {
            const response = await axios.get(`${apiUrl}/${userId}/groups`);
            const groups = Array.isArray(response.data) ? response.data : (response.data.groups || []);
            const mappedGroups = groups.map((g: any) => ({
                ...g,
                name: g.name
            }));
            const sortedGroups = mappedGroups.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setWhatsappGroups(sortedGroups);
        } catch (error) {
            console.error('Error fetching WhatsApp groups:', error);
        } finally {
            setLoadingGroups(false);
        }
    }, [status, apiUrl, userId]);

    useEffect(() => {
        if (show && status === 'connected' && whatsappGroups.length === 0) {
            fetchGroups();
        }
    }, [show, status, fetchGroups]);

    const filteredGroups = useMemo(() => {
        return whatsappGroups.filter(g => {
            if (filterType === 'announcements') return g.isReadOnly;
            return !g.isReadOnly;
        });
    }, [whatsappGroups, filterType]);

    useEffect(() => {
        if (show && whatsappGroups.length > 0 && formData.to) {
            const currentGroup = whatsappGroups.find(g => g.id === formData.to);
            if (currentGroup) {
                setFilterType(currentGroup.isReadOnly ? 'announcements' : 'groups');
            }
        }
    }, [show, whatsappGroups, formData.to]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.to || !formData.message) {
            Swal.fire('Error', 'El destino y el mensaje son obligatorios.', 'error');
            return;
        }

        const [year, month, day] = formData.fecha.split('-').map(Number);
        const [hour, minute] = formData.hora.split(':').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute);
        const now = new Date();
        const minAllowedDate = new Date(now.getTime() + 2 * 60 * 1000);

        if (isNaN(scheduledDate.getTime())) {
            Swal.fire('Error', 'Fecha u hora inválida', 'error');
            return;
        }

        if (scheduledDate < minAllowedDate) {
            Swal.fire({
                title: 'Hora inválida',
                text: 'La hora de programación debe ser al menos 2 minutos posterior a la hora actual.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        if (timeError) return;

        const scheduledTime = scheduledDate.toISOString();

        setLoading(true);
        try {
            await axios.put(route('api.scheduled.update', { id: event.id }), {
                to: formData.to,
                message: formData.message,
                media: mediaParsed, // Send parsed media back
                scheduledTime: scheduledTime
            });

            Swal.fire({
                title: '¡Actualizado!',
                text: 'El mensaje programado ha sido actualizado.',
                icon: 'success',
                confirmButtonColor: '#10b981'
            });
            onClose();
        } catch (error: any) {
            console.error('Error updating message:', error);
            Swal.fire('Error', error.response?.data?.error || 'Hubo un problema al actualizar el mensaje.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: '¿Eliminar mensaje?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await axios.delete(route('api.scheduled.destroy', { id: event.id }));
                
                Swal.fire('¡Eliminado!', 'El mensaje ha sido eliminado.', 'success');
                onClose();
            } catch (error: any) {
                console.error('Error deleting message:', error);
                Swal.fire('Error', error.response?.data?.error || 'Hubo un problema al eliminar el mensaje.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Modal closeable show={show} onClose={onClose} title="Editar Mensaje Programado" maxWidth="2xl">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="edit-fecha">Fecha de Programación</Label>
                        <Input 
                            id="edit-fecha"
                            type="date" 
                            value={formData.fecha} 
                            onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-hora" className={timeError ? 'text-red-500' : ''}>Hora de Envío</Label>
                        <Input 
                            id="edit-hora"
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

                <div className="space-y-4">
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
                        name="to"
                        title="Grupo Destino"
                        multiple={false}
                        placeholder="Seleccione un destino"
                        lista={
                            whatsappGroups.length > 0 
                                ? (filteredGroups.some(g => g.id === formData.to) 
                                    ? filteredGroups 
                                    : (whatsappGroups.some(g => g.id === formData.to) 
                                        ? [...filteredGroups, whatsappGroups.find(g => g.id === formData.to)] 
                                        : [...filteredGroups, { id: formData.to, name: `[No encontrado] ${formData.to}` }]))
                                : (formData.to ? [{ id: formData.to, name: formData.to }] : [])
                        }
                        item={{ idx: 'id', value: 'name' }}
                        value={formData.to}
                        onChange={(val) => setFormData(prev => ({ ...prev, to: val as string }))}
                        error={undefined}
                        required
                        isLoading={loadingGroups}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="edit-message">Contenido del Mensaje</Label>
                        <Textarea 
                            id="edit-message"
                            rows={8}
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            required
                        />
                    </div>
                    
                    {mediaParsed?.url && (
                        <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                            <img 
                                src={mediaParsed.url} 
                                alt="Adjunto" 
                                className="w-16 h-16 object-cover rounded shadow-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium">Imagen adjunta</span>
                                <span className="text-xs text-slate-500 truncate">{mediaParsed.url}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        <Trash className="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || loadingGroups || !!timeError}
                            loading={loading || loadingGroups}
                        >
                            Actualizar Mensaje
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
