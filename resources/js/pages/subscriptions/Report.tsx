import { CreditCard, Users, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/DataTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Reporte de Suscripciones', href: route('subscriptions.report') },
];

export default function Report() {
    const [stats, setStats] = useState<any>({ cuentas: 0, locales: 0, general: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const response = await axios.get(route('api.subscriptions.stats'));
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            return d.toISOString().split('T')[0];
        } catch (e) {
            return date;
        }
    };

    const accountColumns = [
        {
            name: 'Nombre',
            selector: (row: any) => row.nombre,
            sortable: true,
            sortField: 'nombre',
        },
        {
            name: 'Precio',
            selector: (row: any) => row.precio_suscripcion,
            sortable: true,
            sortField: 'precio_suscripcion',
            cell: (row: any) => <span className="font-semibold text-slate-700">${Number(row.precio_suscripcion || 0).toLocaleString()}</span>,
        },
        {
            name: 'Vencimiento',
            selector: (row: any) => row.fecha_vencimiento,
            sortable: true,
            sortField: 'fecha_vencimiento',
            cell: (row: any) => formatDate(row.fecha_vencimiento),
        },
        {
            name: 'Estado',
            cell: (row: any) => (
                <Badge variant={row.estado ? 'default' : 'destructive'}>
                    {row.estado ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        }
    ];

    const userColumns = [
        {
            name: 'Nombre',
            selector: (row: any) => row.name,
            sortable: true,
            sortField: 'name',
        },
        {
            name: 'Usuario',
            selector: (row: any) => row.username,
            sortable: true,
            sortField: 'username',
        },
        {
            name: 'Precio',
            selector: (row: any) => row.precio_suscripcion,
            sortable: true,
            sortField: 'precio_suscripcion',
            cell: (row: any) => <span className="font-semibold text-slate-700">${Number(row.precio_suscripcion || 0).toLocaleString()}</span>,
        },
        {
            name: 'Vencimiento',
            selector: (row: any) => row.fecha_vencimiento,
            sortable: true,
            sortField: 'fecha_vencimiento',
            cell: (row: any) => formatDate(row.fecha_vencimiento),
        },
        {
            name: 'Estado',
            cell: (row: any) => (
                <Badge variant={row.estado ? 'default' : 'destructive'}>
                    {row.estado ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporte de Suscripciones" />

            <div className="p-4 space-y-6">
                <PageHeader
                    title="Reporte de Suscripciones"
                    description="Resumen de recaudación y estado de suscripciones manejado en tiempo real."
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suscripciones Cuentas</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Number(stats.cuentas).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Total proyectado cuentas activas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suscripciones Locales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Number(stats.locales).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Total proyectado usuarios locales activos</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Recaudación</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">${Number(stats.general).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Suma total proyectada</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <SubscriptionsSection 
                        title="Gestión de Cuentas" 
                        description="Listado de empresas y sus planes" 
                        icon={CreditCard}
                        typeActive="cuenta_activa"
                        typeInactive="cuenta_inactiva"
                        columns={accountColumns}
                    />
                    <SubscriptionsSection 
                        title="Usuarios Locales" 
                        description="Cuentas individuales de locales" 
                        icon={Users}
                        typeActive="usuario_activo"
                        typeInactive="usuario_inactiva"
                        columns={userColumns}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function SubscriptionsSection({ title, description, icon: Icon, typeActive, typeInactive, columns }: any) {
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <div>
                    <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Icon className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="active" className="w-full">
                    <div className="px-4 pt-4">
                        <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger value="active" className="text-xs gap-2">
                                <CheckCircle2 className="h-3 w-3" /> Activos
                            </TabsTrigger>
                            <TabsTrigger value="inactive" className="text-xs gap-2">
                                <AlertCircle className="h-3 w-3" /> Inactivos
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="active" className="mt-4">
                        <SubscriptionTable type={typeActive} columns={columns} />
                    </TabsContent>
                    <TabsContent value="inactive" className="mt-4">
                        <SubscriptionTable type={typeInactive} columns={columns} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function SubscriptionTable({ type, columns }: { type: string, columns: any[] }) {
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 10 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        sort_field: type.startsWith('cuenta') ? 'nombre' : 'name',
        sort_order: 'asc',
        page: 1,
        per_page: 10,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.subscriptions.data'), {
                params: { ...filters, type }
            });
            setItems(response.data.data);
            setMeta({
                total: response.data.total,
                current_page: response.data.current_page,
                per_page: response.data.per_page,
            });
        } catch (error) {
            console.error('Error fetching table data:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, type]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="border-t border-slate-100">
            <DataGrid
                data={items}
                columns={columns}
                total={meta.total}
                currentPage={meta.current_page}
                paginationPerPage={meta.per_page}
                serverSide={true}
                paginationServer={true}
                processing={loading}
                fetchPage={(page) => setFilters(prev => ({ ...prev, page }))}
                setPageSize={(per_page) => setFilters(prev => ({ ...prev, per_page, page: 1 }))}
                onSort={(column: any, sortOrder) => {
                    setFilters(prev => ({ 
                        ...prev, 
                        sort_field: column.sortField, 
                        sort_order: sortOrder,
                        page: 1 
                    }));
                }}
            />
        </div>
    );
}
