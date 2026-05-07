import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type Auth, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    CheckCircle2,
    Loader2,
    LogOut,
    QrCode,
    RefreshCw,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import '@/../css/calendar.scss';

// Components
import { ActivityModal } from './components/ActivityModal';
import { EditActivityModal } from './components/EditActivityModal';
import { QRModal } from './components/QRModal';
import { CalendarView } from './components/CalendarView';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Panel principal',
        href: '/dashboard',
    },
    {
        title: 'WhatsApp',
        href: '/whatsapp',
    },
];

interface Props {
    auth: Auth;
    cuentas: any[];
}

export default function WhatsappPage({ cuentas }: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth.user.role === 'superadmin';
    const apiUrl = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001/api';

    const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
    const [refreshing, setRefreshing] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [filterCuentaId, setFilterCuentaId] = useState<string>('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const fetchScheduledMessages = async () => {
        try {
            const response = await axios.get(route('api.scheduled.index'), {
                params: { cuenta_id: filterCuentaId }
            });
            const messages = Array.isArray(response.data) ? response.data : [];
            
            const calendarEvents = messages.map((msg: any) => ({
                id: msg.id,
                title: msg.recipient || 'Mensaje',
                start: msg.scheduledTime,
                color: msg.status === 'sent' ? '#10b981' : '#3b82f6',
                extendedProps: {
                    ...msg
                }
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error fetching scheduled messages:', error);
        }
    };

    useEffect(() => {
        fetchScheduledMessages();
    }, [filterCuentaId]);

    const checkStatus = async () => {
        setRefreshing(true);
        try {
            const response = await axios.get(`${apiUrl}/${auth.user.id}/status`);
            if (response.data.status === 'ready' || response.data.ready) {
                setStatus('connected');
                if (showQRModal) setShowQRModal(false);
            } else {
                setStatus('disconnected');
            }
        } catch (error) {
            setStatus('disconnected');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    useEffect(() => {
        try {
            // En producción, apiUrl será "https://bodegastock.com/whatsapp-api"
            // El socket debe conectar al origen (dominio) directamente
            const socketUrl = new URL(apiUrl).origin;
            const socket = io(socketUrl, {
                auth: { userId: auth.user.id },
                secure: true,
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                console.log('✅ Conectado al socket de WhatsApp (Producción)');
            });

            socket.on('whatsapp-status-changed', (data: any) => {
                console.log('🔄 Estado de WhatsApp cambiado:', data);
                if (data.status === 'ready') {
                    setStatus('connected');
                    setShowQRModal(false);
                    fetchScheduledMessages();
                } else if (data.status === 'disconnected') {
                    setStatus('disconnected');
                }
            });

            return () => {
                socket.disconnect();
            };
        } catch (e) {
            console.error('Error inicializando socket.io', e);
        }
    }, [apiUrl, auth.user.id]);

    const handleDateClick = (info: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const clickedDate = new Date(info.date);
        clickedDate.setHours(0, 0, 0, 0);

        if (clickedDate >= today) {
            setSelectedDate(info.dateStr);
            setShowModal(true);
        }
    };

    const handleEventClick = (info: any) => {
        setSelectedEvent(info.event);
        setShowEditModal(true);
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión de WhatsApp?',
            text: "Tendrás que escanear el código QR nuevamente para reconectar.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await axios.post(`${apiUrl}/${auth.user.id}/logout`);
                setStatus('disconnected');
                Swal.fire({
                    title: 'Sesión cerrada',
                    text: 'La sesión ha sido eliminada correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#10b981'
                });
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                Swal.fire('Error', 'No se pudo cerrar la sesión.', 'error');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="WhatsApp" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="WhatsApp"
                        description="Gestiona tus comunicaciones de WhatsApp."
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        {isSuperAdmin && (
                            <div className="min-w-[200px]">
                                <select
                                    value={filterCuentaId}
                                    onChange={(e) => setFilterCuentaId(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                >
                                    <option value="">Todas las cuentas</option>
                                    {cuentas.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div
                            onClick={() => status === 'disconnected' && setShowQRModal(true)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm transition-all duration-300 ${
                                status === 'connected' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                status === 'disconnected' ? 'bg-red-50 border-red-200 text-red-700 cursor-pointer hover:bg-red-100' :
                                'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                        >
                            {status === 'loading' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : status === 'connected' ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium uppercase tracking-wider">
                                {status === 'loading' ? 'Verificando...' : status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    checkStatus();
                                    fetchScheduledMessages();
                                }}
                                disabled={refreshing}
                                className="ml-2 hover:bg-black/5 p-1 rounded-full transition-colors"
                                title="Refrescar estado"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>

                            {status === 'connected' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogout();
                                    }}
                                    className="ml-1 hover:bg-red-100 text-red-600 p-1 rounded-full transition-colors"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {status === 'loading' ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 bg-white dark:bg-slate-900 rounded-xl border shadow-sm">
                        <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                        <p className="text-slate-500 animate-pulse">Verificando conexión con WhatsApp...</p>
                    </div>
                ) : status === 'connected' ? (
                    <CalendarView 
                        events={events} 
                        onDateClick={handleDateClick} 
                        onEventClick={handleEventClick} 
                    />
                ) : (
                    <div className="group relative overflow-hidden rounded-3xl border bg-card p-12 text-center hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-500/10 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <QrCode className="h-8 w-8 text-emerald-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Servicio no vinculado</h3>
                                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                    Para gestionar tus mensajes programados y ver el calendario, primero debes vincular tu cuenta de WhatsApp.
                                </p>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={() => setShowQRModal(true)}
                                    className="px-8 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                                >
                                    Vincular WhatsApp ahora
                                </Button>
                            </div>
                        </div>

                        {/* Decoración de fondo consistente con la línea de diseño */}
                        <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/10 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-300"></div>
                    </div>
                )}
            </div>

            <QRModal
                show={showQRModal}
                onClose={() => setShowQRModal(false)}
                apiUrl={apiUrl}
                userId={auth.user.id}
            />

            <ActivityModal
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                    fetchScheduledMessages();
                }}
                selectedDate={selectedDate}
                isSuperAdmin={isSuperAdmin}
                cuentas={cuentas}
                userId={auth.user.id}
                userCuentaId={auth.user.cuenta_id}
                apiUrl={apiUrl}
                status={status}
            />

            <EditActivityModal
                show={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    fetchScheduledMessages();
                }}
                event={selectedEvent}
                userId={auth.user.id}
                apiUrl={apiUrl}
                status={status}
            />
        </AppLayout>
    );
}
