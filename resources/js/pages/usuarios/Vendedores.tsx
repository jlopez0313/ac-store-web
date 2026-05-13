import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Edit, Search as SearchIcon, Trash, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Vendedor {
    id: number | null;
    nombre: string;
    documento: string;
    estado: boolean;
    cuenta_id: string;
}

export default function Vendedores({ targetUser, cuentas, locals }: { targetUser: any, cuentas: any[], locals: any[] }) {
    const { isSuperAdmin } = useAuth();
    const [vendedores, setVendedores] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Vendedor>({
        id: null,
        nombre: '',
        documento: '',
        estado: true,
        cuenta_id: targetUser?.cuenta_id?.toString() || '',
        user_id: targetUser?.id?.toString() || ''
    });
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Panel principal', href: route('dashboard') },
        { title: 'Usuarios', href: route('usuarios.index') },
        { title: targetUser ? `Vendedores - ${targetUser.name}` : 'Todos los Vendedores', href: '#' },
    ];

    const fetchVendedores = async (params = {}) => {
        setLoading(true);
        try {
            const res = await axios.get(route('api.vendedores.index'), {
                params: {
                    user_id: targetUser?.id,
                    search: search,
                    ...params
                }
            });
            setVendedores(res.data.data);
        } catch (error) {
            console.error(error);
            showAlert('error', 'No se pudieron cargar los vendedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendedores();
    }, [targetUser?.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (formData.id) {
                await axios.put(route('api.vendedores.update', { vendedore: formData.id }), formData);
                showAlert('success', 'Vendedor actualizado correctamente');
            } else {
                await axios.post(route('api.vendedores.store'), {
                    ...formData,
                    user_id: formData.user_id || targetUser?.id
                });
                showAlert('success', 'Vendedor creado correctamente');
            }
            setIsFormOpen(false);
            fetchVendedores();
        } catch (error: any) {
            showAlert('error', error.response?.data?.message || 'Error al guardar el vendedor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        const res = await confirmDialog({
            title: '¿Eliminar vendedor?',
            text: 'Esta acción moverá al vendedor a la papelera.',
            icon: 'warning',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (res.isConfirmed) {
            try {
                await axios.delete(route('api.vendedores.destroy', { vendedore: id }));
                showAlert('success', 'Vendedor eliminado');
                fetchVendedores();
            } catch (error) {
                showAlert('error', 'No se pudo eliminar el vendedor');
            }
        }
    };

    const columns = [
        {
            name: 'Nombre',
            selector: (row: any) => row.nombre,
            sortable: true,
            cell: (row: any) => <span className="font-medium text-slate-900 dark:text-white">{row.nombre}</span>
        },
        {
            name: 'Documento',
            selector: (row: any) => row.documento || 'N/A',
            sortable: true
        },
        {
            name: 'Usuario Local',
            selector: (row: any) => row.user?.name || 'N/A',
            sortable: true,
        },
        {
            name: 'Cuenta',
            selector: (row: any) => row.cuenta?.nombre || 'N/A',
            sortable: true,
        },
        {
            name: 'Estado',
            cell: (row: any) => (
                <Badge variant={row.estado ? 'default' : 'destructive'}>
                    {row.estado ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        },
    ];

    const actions = [
        {
            title: 'Editar',
            icon: Edit,
            action: (id: any) => {
                const v = vendedores.find(v => v.id === id);
                setFormData({
                    id: v.id,
                    nombre: v.nombre,
                    documento: v.documento,
                    estado: v.estado,
                    cuenta_id: v.cuenta_id?.toString() || '',
                    user_id: v.user_id?.toString() || ''
                });
                setIsFormOpen(true);
            }
        },
        {
            title: 'Eliminar',
            icon: Trash,
            action: (id: any) => handleDelete(id)
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Vendedores - ${targetUser.name}`} />

            <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={targetUser ? `Vendedores: ${targetUser.name}` : 'Todos los Vendedores'}
                        description={targetUser ? `Gestión de vendedores autorizados para ${targetUser.cuenta?.nombre || 'este local'}.` : 'Gestión global de personal de ventas.'}
                    />
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-vendedor"
                                placeholder="Buscar vendedor..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchVendedores({ search })}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => fetchVendedores({ search })}
                        >
                            <SearchIcon className="h-4 w-4 mr-2" />
                            Buscar
                        </Button>
                    </div>
                    <Button onClick={() => {
                        setFormData({
                            id: null,
                            nombre: '',
                            documento: '',
                            estado: true,
                            cuenta_id: targetUser?.cuenta_id?.toString() || '',
                            user_id: targetUser?.id?.toString() || ''
                        });
                        setIsFormOpen(true);
                    }}>
                        <UserPlus className="mr-2 h-5 w-5" />
                        Nuevo Vendedor
                    </Button>
                </div>

                <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={vendedores}
                        columns={columns}
                        actions={actions}
                        processing={loading}
                    />
                </div>
            </div>

            <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} title={formData.id ? 'Editar Vendedor' : 'Nuevo Vendedor'}>
                <form onSubmit={handleSave} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InputField
                            name="nombre"
                            title="Nombre del Vendedor"
                            required
                            value={formData.nombre}
                            onChange={(val) => setFormData({ ...formData, nombre: val as string })}
                            placeholder="Ej. Juan Pérez"
                        />
                        <InputField
                            name="documento"
                            title="Documento / ID"
                            value={formData.documento}
                            onChange={(val) => setFormData({ ...formData, documento: val as string })}
                            placeholder="Ej. 123456789"
                        />
                        {!targetUser && (
                            <SelectField
                                name="user_id"
                                title="Usuario Local / Sede"
                                required
                                value={formData.user_id}
                                onChange={(val) => {
                                    const local = locals.find(l => l.id.toString() === val);
                                    setFormData({
                                        ...formData,
                                        user_id: val as string,
                                        cuenta_id: local?.cuenta_id?.toString() || formData.cuenta_id
                                    });
                                }}
                                lista={locals || []}
                                item={{ idx: 'id', value: 'name' }}
                            />
                        )}
                        <SelectField
                            name="cuenta_id"
                            title="Cuenta / Empresa"
                            required
                            value={formData.cuenta_id}
                            onChange={(val) => setFormData({ ...formData, cuenta_id: val as string })}
                            lista={cuentas || []}
                            item={{ idx: 'id', value: 'nombre' }}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={saving}>
                            {formData.id ? 'Actualizar Vendedor' : 'Crear Vendedor'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
