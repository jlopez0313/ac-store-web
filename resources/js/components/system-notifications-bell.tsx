import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/Modal';
import axios from 'axios';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Trash2, MailOpen } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read_at: string | null;
    created_at: string;
}

export function SystemNotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const handleMarkAsRead = async (id: number) => {
        try {
            await axios.post(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-rose-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 cursor-pointer">
                        <Bell className="h-4 w-4 text-slate-500" />
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] text-white">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border-slate-200 shadow-xl dark:border-slate-800">
                    <div className="flex items-center justify-between border-b px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Notificaciones</span>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-tight"
                            >
                                Marcar todo leído
                            </button>
                        )}
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-400">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">No tienes notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <DropdownMenuItem
                                    key={n.id}
                                    onClick={() => {
                                        setSelectedNotification(n);
                                        if (!n.read_at) handleMarkAsRead(n.id);
                                    }}
                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0 border-slate-50 dark:border-slate-800 ${!n.read_at ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                                >
                                    <div className="mt-0.5">{getIcon(n.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-bold truncate ${!n.read_at ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {n.title}
                                        </div>
                                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                            {n.message}
                                        </div>
                                        <div className="text-[9px] text-slate-400 mt-1 uppercase font-medium">
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {!n.read_at && <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1" />}
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Detail Modal */}
            <Modal
                show={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                title={selectedNotification?.title || 'Detalle de Notificación'}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        {selectedNotification && getIcon(selectedNotification.type)}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {selectedNotification && new Date(selectedNotification.created_at).toLocaleString()}
                        </span>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {selectedNotification?.message}
                        </p>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button onClick={() => setSelectedNotification(null)}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
