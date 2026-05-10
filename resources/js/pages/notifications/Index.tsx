import { AppLayout } from '@/layouts/app-layout';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectField } from '@/components/SelectField';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { showAlert } from '@/plugins/sweetalert';
import { Megaphone, Send, Users, User, Landmark, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const breadcrumbs = [
    { title: 'Anuncios', href: '/anuncios' },
];

export default function NotificationsIndex() {
    const [loading, setLoading] = useState(false);
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        target_type: 'all',
        target_id: ''
    });

    useEffect(() => {
        fetchCuentas();
        fetchUsuarios();
    }, []);

    const fetchCuentas = async () => {
        try {
            const response = await axios.get('/api/cuentas');
            setCuentas(response.data.data.map((c: any) => ({ label: c.nombre, value: String(c.id) })));
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchUsuarios = async () => {
        try {
            const response = await axios.get('/api/usuarios');
            setUsuarios(response.data.data.map((u: any) => ({ label: `${u.name} (${u.username})`, value: String(u.id) })));
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.message) {
            showAlert('warning', 'Por favor completa el título y el mensaje.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/notifications/broadcast', formData);
            showAlert('success', 'Anuncios enviados correctamente.');
            setFormData({
                title: '',
                message: '',
                type: 'info',
                target_type: 'all',
                target_id: ''
            });
        } catch (error) {
            console.error('Error sending notifications:', error);
            showAlert('error', 'Error al enviar los anuncios.');
        } finally {
            setLoading(false);
        }
    };

    const targetOptions = [
        { label: 'Todos los Usuarios', value: 'all', icon: Users },
        { label: 'Por Empresa/Cuenta', value: 'account', icon: Landmark },
        { label: 'Usuario Específico', value: 'user', icon: User },
    ];

    const typeOptions = [
        { label: 'Informativo (Azul)', value: 'info', icon: Info, color: 'text-blue-500' },
        { label: 'Éxito (Verde)', value: 'success', icon: CheckCircle, color: 'text-emerald-500' },
        { label: 'Advertencia (Amarillo)', value: 'warning', icon: AlertTriangle, color: 'text-amber-500' },
        { label: 'Crítico (Rojo)', value: 'error', icon: XCircle, color: 'text-rose-500' },
    ];

    return (
        <AppLayout>
            <Head title="Enviar Anuncios" />
            <div className="flex flex-col gap-4 p-4 md:p-8">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Megaphone className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Nuevo Anuncio</CardTitle>
                                    <CardDescription>Envía una novedad a los usuarios de la plataforma.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">Título del Anuncio</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ej: Mantenimiento del Sistema"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-10 border-slate-200 focus-visible:ring-indigo-500 dark:border-slate-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-500">Mensaje</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Escribe aquí el contenido de la novedad..."
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="border-slate-200 focus-visible:ring-indigo-500 dark:border-slate-800"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo de Alerta</Label>
                                        <SelectField
                                            name="type"
                                            options={typeOptions}
                                            value={formData.type}
                                            onChange={(val) => setFormData({ ...formData, type: val as string })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Destinatarios</Label>
                                        <SelectField
                                            name="target_type"
                                            options={targetOptions}
                                            value={formData.target_type}
                                            onChange={(val) => setFormData({ ...formData, target_type: val as string, target_id: '' })}
                                        />
                                    </div>
                                </div>

                                {formData.target_type === 'account' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Seleccionar Empresa / Cuenta</Label>
                                        <SelectField
                                            name="target_id"
                                            options={cuentas}
                                            value={formData.target_id}
                                            onChange={(val) => setFormData({ ...formData, target_id: val as string })}
                                            placeholder="Seleccione una cuenta..."
                                        />
                                    </div>
                                )}

                                {formData.target_type === 'user' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Seleccionar Usuario</Label>
                                        <SelectField
                                            name="target_id"
                                            options={usuarios}
                                            value={formData.target_id}
                                            onChange={(val) => setFormData({ ...formData, target_id: val as string })}
                                            placeholder="Busque un usuario..."
                                        />
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" loading={loading}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar Anuncio Ahora
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Vista Previa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-xl p-6 bg-white dark:bg-slate-950 shadow-lg border-slate-200 dark:border-slate-800 max-w-sm mx-auto">
                                <div className="flex items-center gap-3 mb-4">
                                    {typeOptions.find(o => o.value === formData.type)?.icon({ className: `h-6 w-6 ${typeOptions.find(o => o.value === formData.type)?.color}` })}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hoy, {new Date().toLocaleTimeString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    {formData.title || 'Título del Anuncio'}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {formData.message || 'Aquí se verá el contenido de tu mensaje...'}
                                </p>
                                <div className="mt-8 flex justify-end">
                                    <Button size="sm" variant="outline" disabled className="text-xs">
                                        Entendido
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                                <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-2">Resumen de Envío</h4>
                                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                                    <li className="flex justify-between">
                                        <span>Destinatarios:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{targetOptions.find(o => o.value === formData.target_type)?.label}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Prioridad:</span>
                                        <span className="font-bold text-slate-900 dark:text-white capitalize">{formData.type}</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
