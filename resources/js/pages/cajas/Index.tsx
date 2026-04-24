import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Layers, Search as SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { TallarCajaModal } from './TallarCajaModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Cajas', href: route('cajas.index') },
];

export default function Index({ filters: initialFilters, bodegas }: any) {
    const [items, setItems] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);

    const [selectedCaja, setSelectedCaja] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        per_page: initialFilters?.per_page || 25,
        page: initialFilters?.page || 1,
    });

    const fetchData = useCallback(
        async (newParams = {}) => {
            setLoading(true);
            const params = { ...filters, ...newParams };
            try {
                const response = await axios.get(route('api.cajas.index'), { params });
                setItems(response.data.data);
                setMeta(response.data.meta);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        },
        [filters],
    );

    useEffect(() => {
        fetchData();
    }, [filters.page, filters.per_page]);

    const handleSearch = (search: string) => {
        setFilters((prev) => ({ ...prev, search, page: 1 }));
        fetchData({ search, page: 1 });
    };

    const openTallarModal = (caja: any) => {
        setSelectedCaja(caja);
        setIsModalOpen(true);
    };

    const columns = [
        {
            name: 'Foto',
            width: '70px',
            cell: (row: any) => (
                <div 
                    className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 transition-transform hover:scale-110"
                    onClick={() => setViewerImage(row.referencia_foto)}
                >
                    {row.referencia_foto ? (
                        <img src={`/storage/${row.referencia_foto}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400">N/A</div>
                    )}
                </div>
            ),
        },
        {
            name: 'Código',
            selector: (row: any) => row.referencia_codigo,
            sortable: true,
            width: '120px',
            cell: (row: any) => <span className="text-primary font-mono font-bold">{row.referencia_codigo}</span>,
        },
        {
            name: 'Producto',
            grow: 2,
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.referencia_descripcion}</span>
                    <span className="text-muted-foreground text-xs">
                        Factura #{row.compra_id} ({row.compra_fecha})
                    </span>
                </div>
            ),
            sortable: true,
            noTruncate: true,
        },
        {
            name: 'Marca',
            selector: (row: any) => row.referencia_marca,
            sortable: true,
            width: '120px',
        },
        {
            name: 'Bodega',
            selector: (row: any) => row.bodega_nombre,
            sortable: true,
            width: '180px',
            cell: (row: any) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.bodega_nombre}</span>,
        },
        {
            name: 'Unid/Caja',
            selector: (row: any) => row.pares_por_caja,
            center: true,
            width: '100px',
        },
        {
            name: 'Total Pares',
            selector: (row: any) => row.cantidad,
            right: true,
            width: '120px',
            cell: (row: any) => <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{row.cantidad}</span>,
        },
        {
            name: 'P. Costo',
            selector: (row: any) => row.precio_compra,
            right: true,
            width: '120px',
            cell: (row: any) => (
                <span className="font-semibold text-slate-600 dark:text-slate-400">${Number(row.precio_compra).toLocaleString()}</span>
            ),
        },
        {
            name: 'P. Venta',
            selector: (row: any) => row.precio_venta,
            right: true,
            width: '120px',
            cell: (row: any) => <span className="font-semibold text-green-600">${Number(row.precio_venta).toLocaleString()}</span>,
        },
    ];

    const actions = [
        {
            title: 'Tallar',
            icon: Layers,
            action: (id: number) => {
                const item = items.find((i: any) => i.id === id);
                if (item) openTallarModal(item);
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cajas" />

            <div className="space-y-6 p-4">
                <PageHeader title="Control de Cajas" description="Gestiona las cajas de productos recibidas de proveedores pendientes por tallar." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por código, descripción..."
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
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1 text-xs">
                            Registros: {meta.total}
                        </Badge>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={meta.total}
                        processing={loading}
                        currentPage={meta.current_page}
                        paginationPerPage={meta.per_page}
                        actions={actions}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => setFilters((prev) => ({ ...prev, page }))}
                        setPageSize={(size) => setFilters((prev) => ({ ...prev, per_page: size, page: 1 }))}
                        onSort={() => {}}
                    />
                </div>
            </div>

            <TallarCajaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                caja={selectedCaja}
                bodegas={bodegas}
                onSuccess={() => fetchData()}
            />

            <ViewerModal 
                show={!!viewerImage} 
                image={viewerImage} 
                onClose={() => setViewerImage(null)} 
            />
        </AppLayout>
    );
}
