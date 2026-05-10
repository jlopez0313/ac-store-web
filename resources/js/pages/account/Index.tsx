import { AppLayout } from '@/layouts/app-layout';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Head } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppearance } from '@/hooks/use-appearance';
import { Sun, Moon, Monitor, CheckCircle2, ShieldCheck, CreditCard, MessageSquare, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AccountIndex() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { appearance, updateAppearance } = useAppearance();
    
    // Form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/profile');
            setData(res.data);
            setProfileForm({
                name: res.data.user.name,
                username: res.data.user.username,
                email: res.data.user.email,
                password: '',
                password_confirmation: '',
            });
        } catch (error) {
            toast.error('Error al cargar la información del perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.post('/api/profile', profileForm);
            toast.success(res.data.message);
            // Update username in case it was auto-incremented
            setProfileForm(prev => ({ ...prev, username: res.data.username, password: '', password_confirmation: '' }));
            fetchProfile();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    const breadcrumbs = [
        { title: 'Inicio', href: '/dashboard' },
        { title: 'Mi Cuenta', href: '/mi-cuenta' },
    ];

    return (
        <AppLayout breadcrumbs={<Breadcrumbs items={breadcrumbs} />}>
            <Head title="Mi Cuenta" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Mi Cuenta</h1>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        <TabsTrigger value="permissions">Permisos</TabsTrigger>
                        <TabsTrigger value="payments">Pagos</TabsTrigger>
                        <TabsTrigger value="contact">Contacto</TabsTrigger>
                    </TabsList>

                    {/* PROFILE TAB */}
                    <TabsContent value="profile" className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserIcon className="h-5 w-5 text-primary" />
                                        Información Personal
                                    </CardTitle>
                                    <CardDescription>Actualiza tus datos de acceso y contacto.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre Completo</Label>
                                            <Input 
                                                id="name" 
                                                value={profileForm.name} 
                                                onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Nombre de Usuario</Label>
                                            <Input 
                                                id="username" 
                                                value={profileForm.username} 
                                                onChange={e => setProfileForm({...profileForm, username: e.target.value})} 
                                                required 
                                            />
                                            <p className="text-[0.8rem] text-muted-foreground">Si el usuario ya existe, se le asignará un sufijo numérico (01, 02...).</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Correo Electrónico</Label>
                                            <Input 
                                                id="email" 
                                                type="email" 
                                                value={profileForm.email} 
                                                onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Nueva Contraseña</Label>
                                                <Input 
                                                    id="password" 
                                                    type="password" 
                                                    value={profileForm.password} 
                                                    onChange={e => setProfileForm({...profileForm, password: e.target.value})} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation">Confirmar</Label>
                                                <Input 
                                                    id="password_confirmation" 
                                                    type="password" 
                                                    value={profileForm.password_confirmation} 
                                                    onChange={e => setProfileForm({...profileForm, password_confirmation: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={saving}>
                                            {saving ? 'Guardando...' : 'Actualizar Perfil'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Monitor className="h-5 w-5 text-primary" />
                                        Apariencia
                                    </CardTitle>
                                    <CardDescription>Personaliza cómo se ve la plataforma.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <Button 
                                            variant={appearance === 'light' ? 'default' : 'outline'} 
                                            className="flex flex-col h-20 gap-2"
                                            onClick={() => updateAppearance('light')}
                                        >
                                            <Sun className="h-5 w-5" />
                                            Claro
                                        </Button>
                                        <Button 
                                            variant={appearance === 'dark' ? 'default' : 'outline'} 
                                            className="flex flex-col h-20 gap-2"
                                            onClick={() => updateAppearance('dark')}
                                        >
                                            <Moon className="h-5 w-5" />
                                            Oscuro
                                        </Button>
                                        <Button 
                                            variant={appearance === 'system' ? 'default' : 'outline'} 
                                            className="flex flex-col h-20 gap-2"
                                            onClick={() => updateAppearance('system')}
                                        >
                                            <Monitor className="h-5 w-5" />
                                            Sistema
                                        </Button>
                                    </div>
                                    <div className="pt-6 border-t">
                                        <h4 className="text-sm font-medium mb-2">Resumen de Cuenta</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Rol:</span>
                                                <Badge variant="secondary" className="capitalize">{data.user.role}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Corte de Pago:</span>
                                                <span className="font-medium text-orange-500">{data.user.fecha_vencimiento || 'No definida'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Valor Mensual:</span>
                                                <span className="font-bold text-primary">${data.user.precio_suscripcion?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* PERMISSIONS TAB */}
                    <TabsContent value="permissions" className="pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    Bodegas y Permisos
                                </CardTitle>
                                <CardDescription>Listado de bodegas donde tienes permisos de visualización o pedido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cuenta / Empresa</TableHead>
                                            <TableHead>Bodega</TableHead>
                                            <TableHead className="text-center">Ver</TableHead>
                                            <TableHead className="text-center">Pedir</TableHead>
                                            <TableHead className="text-center">Descuento</TableHead>
                                            <TableHead className="text-right">Costo Acceso</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.permissions.map((perm: any) => (
                                            <TableRow key={perm.id}>
                                                <TableCell className="font-medium">{perm.cuenta_nombre}</TableCell>
                                                <TableCell>{perm.bodega_nombre}</TableCell>
                                                <TableCell className="text-center">
                                                    {perm.can_view ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {perm.can_order ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {perm.descuento > 0 ? <Badge variant="outline">{perm.descuento}%</Badge> : '0%'}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground">
                                                    ${perm.precio_acceso.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.permissions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No tienes accesos configurados aún.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <p className="mt-4 text-[0.8rem] text-muted-foreground italic">
                                    * El costo de acceso se calcula por cuenta única. Si tienes acceso a múltiples bodegas de la misma cuenta, solo pagas una vez por esa cuenta.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PAYMENTS TAB */}
                    <TabsContent value="payments" className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        Historial de Pagos
                                    </CardTitle>
                                    <CardDescription>Registro de tus pagos confirmados por administración.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha Pago</TableHead>
                                                <TableHead>Monto</TableHead>
                                                <TableHead>Próximo Corte</TableHead>
                                                <TableHead>Registrado por</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.payments.map((payment: any) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{payment.payment_date}</TableCell>
                                                    <TableCell className="font-bold">${payment.amount.toLocaleString()}</TableCell>
                                                    <TableCell>{payment.next_cutoff_date}</TableCell>
                                                    <TableCell className="text-muted-foreground">{payment.registered_by}</TableCell>
                                                </TableRow>
                                            ))}
                                            {data.payments.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                        No se han registrado pagos aún.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Landmark className="h-5 w-5 text-primary" />
                                        Métodos de Pago
                                    </CardTitle>
                                    <CardDescription>Cuentas disponibles para realizar tus pagos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {data.payment_methods.map((method: any, idx: number) => (
                                        <div key={idx} className="p-3 rounded-lg border bg-muted/50">
                                            <p className="text-sm font-bold">{method.name}</p>
                                            <p className="text-sm text-muted-foreground">{method.details}</p>
                                        </div>
                                    ))}
                                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                                        <p className="text-xs text-primary font-medium mb-1">Nota importante:</p>
                                        <p className="text-xs text-muted-foreground">
                                            Una vez realizado el pago, envía el comprobante al WhatsApp de soporte para su validación.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* CONTACT TAB */}
                    <TabsContent value="contact" className="pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Soporte y Contacto
                                </CardTitle>
                                <CardDescription>¿Necesitas ayuda o quieres reportar un pago? Contáctanos.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2 max-w-3xl">
                                <div className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                                    <div className="p-3 rounded-full bg-green-500/10 text-green-600">
                                        <MessageSquare className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">WhatsApp de Soporte</h4>
                                        <p className="text-sm text-muted-foreground mb-3">Disponible para dudas técnicas y reportes de pago.</p>
                                        <a 
                                            href={`https://wa.me/${data.contacts.whatsapp.replace(/\+/g, '')}`} 
                                            target="_blank" 
                                            className="inline-flex items-center text-sm font-bold text-green-600 hover:underline"
                                        >
                                            {data.contacts.whatsapp}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-600">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Correo Electrónico</h4>
                                        <p className="text-sm text-muted-foreground mb-3">Para solicitudes administrativas o formales.</p>
                                        <a 
                                            href={`mailto:${data.contacts.email}`} 
                                            className="inline-flex items-center text-sm font-bold text-blue-600 hover:underline"
                                        >
                                            {data.contacts.email}
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
