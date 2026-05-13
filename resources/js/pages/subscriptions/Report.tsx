import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, CreditCard, DollarSign, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
            cell: (row: any) => <span className="font-semibold text-slate-700 dark:text-slate-300">${Number(row.precio_suscripcion || 0).toLocaleString()}</span>,
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
            cell: (row: any) => <span className="font-semibold text-slate-700 dark:text-slate-300">${Number(row.precio_suscripcion || 0).toLocaleString()}</span>,
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
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-white shadow-md">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Bodegas ({stats.cuentas_count || 0})</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">${Number(stats.cuentas || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white shadow-md">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Locales ({stats.locales_count || 0})</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">${Number(stats.locales || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-600 text-white shadow-md">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Total Proyectado</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">${Number(stats.general || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    }
                />

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
        <Card className="border-slate-200 shadow-sm overflow-hidden dark:border-slate-700">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4 dark:bg-slate-800/50 dark:border-slate-700">
                <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</CardTitle>
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
                    <TabsContent value="active" className="mt-4 px-4 pb-4">
                        <SubscriptionTable type={typeActive} columns={columns} />
                    </TabsContent>
                    <TabsContent value="inactive" className="mt-4 px-4 pb-4">
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
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
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
