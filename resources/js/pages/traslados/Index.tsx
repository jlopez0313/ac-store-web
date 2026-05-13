import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeftRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ViewerModal } from '@/components/ui/ViewerModal';
import { TransferModal } from './TransferModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Traslados', href: route('traslados.index') },
];

export default function Index({ filters, lista, cuentas, referencias }: any) {
    const {
        data: items,
        meta: { total, current_page, per_page },
    } = lista;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Debounced automatic search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== filters.search) {
                handleSearch(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (search?: string, page?: number, perPage?: number) => {
        router.visit(
            route('traslados.index', {
                search: search !== undefined ? search : searchQuery,
                page: page ?? 1,
                per_page: perPage ?? filters.per_page ?? 25,
            }),
            { preserveState: true, preserveScroll: true },
        );
    };

    const columns = [
        {
            name: 'Foto',
            width: '85px',
            cell: (row: any) => (
                <div 
                    className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 transition-transform hover:scale-110 dark:border-slate-700 dark:bg-slate-800"
                    onClick={() => setViewerImage(row.referencia_foto)}
                >
                    {row.referencia_foto ? (
                        <img src={`/storage/${row.referencia_foto}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-700">N/A</div>
                    )}
                </div>
            ),
        },
        {
            name: 'Producto',
            grow: 1.5,
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <div className="text-primary font-mono font-bold">{row.referencia_codigo}</div>
                    <div className="text-muted-foreground max-w-[200px] truncate text-xs">{row.referencia_descripcion}</div>
                </div>
            ),
            sortable: true,
            noTruncate: true,
        },
        {
            name: 'Talla',
            width: '100px',
            selector: (row: any) => row.talla,
            sortable: true,
        },
        {
            name: 'Origen',
            grow: 1.2,
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.bodega_origen}</div>
                    <div className="font-mono text-xs text-slate-500 italic dark:text-slate-400">{row.estanteria_origen}</div>
                </div>
            ),
            sortable: true,
            noTruncate: true,
        },
        {
            name: 'Destino',
            grow: 1.2,
            cell: (row: any) => (
                <div className="flex flex-col py-2">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.bodega_destino}</div>
                    <div className="font-mono text-xs text-slate-500 italic dark:text-slate-400">{row.estanteria_destino}</div>
                </div>
            ),
            sortable: true,
            noTruncate: true,
        },
        {
            name: 'Cant.',
            width: '100px',
            cell: (row: any) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.cantidad}</span>,
            sortable: true,
        },
        {
            name: 'Responsable',
            selector: (row: any) => row.usuario_nombre,
            sortable: true,
        },
        {
            name: 'Fecha',
            width: '120px',
            selector: (row: any) => row.fecha,
            sortable: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Traslados de Inventario" />

            <div className="p-4 space-y-6">
                <PageHeader title="Historial de Traslados" description="Registro de movimientos de mercancía entre bodegas y estanterías." />

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
                    <div className="flex flex-1 max-w-sm gap-2">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="search-input"
                                placeholder="Buscar por código..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsModalOpen(true)}>
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            Nuevo Traslado
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <DataGrid
                        data={items}
                        columns={columns}
                        total={total}
                        currentPage={current_page}
                        paginationPerPage={per_page}
                        serverSide={true}
                        paginationServer={true}
                        fetchPage={(page) => handleSearch(undefined, page)}
                        setPageSize={(size) => handleSearch(undefined, 1, size)}
                        onSort={() => {}}
                    />
                </div>
            </div>

            <TransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} cuentas={cuentas} referenciasInit={referencias} />
            
            <ViewerModal 
                show={!!viewerImage} 
                image={viewerImage} 
                onClose={() => setViewerImage(null)} 
            />
        </AppLayout>
    );
}
