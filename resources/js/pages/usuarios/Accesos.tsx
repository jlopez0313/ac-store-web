import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Check, Search as SearchIcon, ShieldCheck, X } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { AccesoModal } from './AccesoModal';
import axios from 'axios';

export default function Accesos({ usuario }: any) {
    const { isSuperAdmin } = useAuth();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Panel principal', href: route('dashboard') },
        { title: 'Usuarios', href: route('usuarios.index') },
        { title: `Accesos: ${usuario.name}`, href: route('usuarios.accesos', { usuario: usuario.id }) },
    ];

    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        search: '',
        per_page: 25,
        page: 1,
    });
    
    const [selectedBodega, setSelectedBodega] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async (newParams = {}) => {
        setLoading(true);
        const params = { ...filters, ...newParams };
        try {
            const response = await axios.get(route('api.usuarios.accesos', { usuario: usuario.id }), {
                params: params
            });
            setItems(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            console.error('Error fetching accesos:', error);
        } finally {
            setLoading(false);
        }
    }, [usuario.id, filters]);

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page]);

    const handleSearch = (search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const openModal = (bodega: any) => {
        setSelectedBodega(bodega);
        setIsModalOpen(true);
    };

    const columns = [
        {
            name: 'Bodega',
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <span className="font-bold text-foreground">{row.nombre}</span>
                    <span className="text-xs text-muted-foreground italic">{row.direccion || 'Sin dirección'}</span>
                </div>
            ),
            sortable: true,
            grow: 1.5,
            noTruncate: true,
        },
        {
            name: 'Ver Stock',
            cell: (row: any) => (
                row.can_view ? (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1">
                        <Check className="h-3 w-3" /> Permitido
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground border-border gap-1">
                        <X className="h-3 w-3" /> Denegado
                    </Badge>
                )
            ),
        },
        {
            name: 'Pedir Stock',
            cell: (row: any) => (
                row.can_order ? (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1">
                        <Check className="h-3 w-3" /> Permitido
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground border-border gap-1">
                        <X className="h-3 w-3" /> Denegado
                    </Badge>
                )
            ),
        },
        {
            name: 'Descuento',
            cell: (row: any) => (
                <span className="font-bold text-emerald-600">
                    ${Number(row.descuento || 0).toLocaleString()}
                </span>
            ),
            sortable: true,
        }
    ];

    const actions = [
        {
            title: 'Configurar',
            icon: ShieldCheck,
            action: (id: any) => {
                const item = items.find((i: any) => i.id === id);
                if (item) openModal(item);
            }
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Accesos - ${usuario.name}`} />

            <div className="p-4 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit(route('usuarios.index'))}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={`Bodegas con acceso de: ${usuario.name}`}
                        description="Asigna permisos de visualización y pedido en diferentes bodegas."
                    />
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar bodega por nombre..."
                                className="pl-9"
                                defaultValue={filters.search}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                const val = (document.getElementById('search-input') as HTMLInputElement)?.value;
                                handleSearch(val);
                            }}
                        >
                            <SearchIcon className="h-4 w-4 mr-2" />
                            Buscar
                        </Button>
                    </div>
                </div>

                <div className="bg-background rounded-xl shadow-xs border border-border overflow-hidden">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        actions={actions}
                        processing={loading}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        serverSide={true}
                        paginationServer={true}
                        onSort={() => { }}
                        fetchPage={(page) => setFilters(prev => ({ ...prev, page }))}
                        setPageSize={(size) => setFilters(prev => ({ ...prev, per_page: size, page: 1 }))}
                    />
                </div>
            </div>

            <AccesoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                usuario={usuario}
                bodega={selectedBodega}
                onSuccess={() => fetchData()}
            />
        </AppLayout>
    );
}
