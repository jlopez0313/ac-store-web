import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/form/SelectField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ViewerModal } from '@/components/ui/ViewerModal';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Eye, ImageIcon, Loader2, Search as SearchIcon, X } from 'lucide-react';
import { useState } from 'react';
import { DetailModal } from '../inventario/DetailModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Búsqueda de Referencias', href: route('referencias.search') },
];

export default function Search({ results: initialResults, filters, cuentas, marcas }: any) {
    const { auth }: any = usePage().props;
    const isSuperAdmin = auth.user.role === 'superadmin';

    const [marca, setMarca] = useState(filters.marca || '');
    const [codigo, setCodigo] = useState(filters.codigo || '');
    const [referencia, setReferencia] = useState(filters.referencia || '');
    const [talla, setTalla] = useState(filters.talla || '');
    const [cuentaId, setCuentaId] = useState(filters.cuenta_id || 'all');

    const [results, setResults] = useState(initialResults || []);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [selectedReferencia, setSelectedReferencia] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleSearch = async (page = 1, rowsPerPage = perPage) => {
        setLoading(true);
        try {
            const response = await axios.post(route('api.referencias.search'), {
                marca,
                codigo,
                referencia,
                talla,
                cuenta_id: cuentaId,
                page,
                per_page: rowsPerPage,
            });
            setResults(response.data.data);
            setTotal(response.data.total);
            setCurrentPage(response.data.current_page);
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        handleSearch(page);
    };

    const handlePerRowsChange = async (newPerPage: number, page: number) => {
        setPerPage(newPerPage);
        handleSearch(page, newPerPage);
    };

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(1);
    };

    const handleClear = () => {
        setMarca('');
        setCodigo('');
        setReferencia('');
        setTalla('');
        setCuentaId('all');
        setResults([]);
        setTotal(0);
        setCurrentPage(1);
    };

    const columns = [
        {
            name: 'Foto',
            width: '85px',
            cell: (row: any) => (
                <button
                    type="button"
                    onClick={() => setViewerImage(row.foto)}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 transition-transform hover:scale-110 active:scale-95"
                >
                    {row.foto ? (
                        <img src={row.foto} alt="Product" className="h-full w-full object-cover" />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                    )}
                </button>
            ),
        },
        {
            name: 'Código',
            selector: (row: any) => <span className='font-bold'>{row.codigo}</span>,
            sortable: true,
        },
        {
            name: 'Marca',
            selector: (row: any) => <span className='font-bold'>{row.marca}</span>,
            sortable: true,
        },
        {
            name: 'Descripción',
            selector: (row: any) => row.descripcion,
            wrap: true,
            width: '350px',
        },
        {
            name: 'Stock',
            selector: (row: any) => row.filtered_stock !== null ? row.filtered_stock : row.stock,
            sortable: true,
            width: '180px',
            cell: (row: any) => {
                const mainStock = row.filtered_stock !== null ? row.filtered_stock : row.stock;
                const showTotal = row.filtered_stock !== null;

                return (
                    <div className="flex flex-col">
                        <span className={`font-bold ${mainStock > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-500'}`}>
                            {mainStock} {mainStock === 1 ? 'unidad' : 'unidades'}
                        </span>
                        {showTotal && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 dark:bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-500/20 w-fit mt-0.5">
                                de {row.stock} totales (Talla {talla})
                            </span>
                        )}
                    </div>
                );
            },
        },
        ...(isSuperAdmin
            ? [
                {
                    name: 'Cuenta',
                    selector: (row: any) => row.cuenta,
                },
            ]
            : []),
    ];

    const actions = [
        {
            title: 'Ver Disponibilidad',
            icon: Eye,
            action: (id: any, row: any) => {
                setSelectedReferencia({
                    ...row,
                    total_stock: row.stock // DetailModal expects total_stock
                });
                setIsDetailModalOpen(true);
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Búsqueda de Referencias" />

            <div className="space-y-6 p-4">
                <PageHeader title="Búsqueda de Referencias" description="Busque disponibilidad de productos por marca, código, referencia o talla." />

                <Card className="border-border/50 overflow-visible shadow-sm">
                    <CardContent className="p-4">
                        <form onSubmit={onSearchSubmit} className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-12">
                            {isSuperAdmin && (
                                <div className="lg:col-span-3">
                                    <SelectField
                                        name="cuenta_id"
                                        title="Cuenta"
                                        value={cuentaId}
                                        onChange={(val) => setCuentaId(val as string)}
                                        lista={[{ id: 'all', nombre: 'Todas las cuentas' }, ...cuentas]}
                                        item={{ idx: 'id', value: 'nombre' }}
                                        error={undefined}
                                    />
                                </div>
                            )}
                            {/*
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="marca">Marca</Label>
                                <Input
                                    id="marca"
                                    placeholder="Ej: Nike"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="h-10 bg-white dark:bg-slate-800"
                                />
                            </div>
*/}
                            <div className={`space-y-2 ${isSuperAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                                <Label htmlFor="codigo">Código</Label>
                                <Input
                                    id="codigo"
                                    placeholder="Ej: 12345"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    className="h-10 bg-white dark:bg-slate-800"
                                />
                            </div>

                            <div className={`space-y-2 ${isSuperAdmin ? 'lg:col-span-4' : 'lg:col-span-6'}`}>
                                <Label htmlFor="referencia">Referencia / Descripción</Label>
                                <Input
                                    id="referencia"
                                    placeholder="Ej: Tenis Runner"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className="h-10 bg-white dark:bg-slate-800"
                                />
                            </div>

                            <div className="space-y-2 lg:col-span-1">
                                <Label htmlFor="talla">Talla</Label>
                                <Input
                                    id="talla"
                                    placeholder="Ej: 38"
                                    value={talla}
                                    onChange={(e) => setTalla(e.target.value)}
                                    className="h-10 bg-white dark:bg-slate-800"
                                />
                            </div>

                            <div className="flex min-w-[120px] gap-2 lg:col-span-2">
                                <Button type="submit" className="h-10 flex-1" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClear}
                                    size="icon"
                                    className="h-10 w-10 shrink-0"
                                    title="Limpiar filtros"
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="bg-background border-border overflow-hidden rounded-md border shadow-xs">
                    <DataGrid
                        data={results}
                        columns={columns}
                        total={total}
                        actions={actions}
                        onSort={() => { }}
                        fetchPage={handlePageChange}
                        setPageSize={(size) => handlePerRowsChange(size, 1)}
                        serverSide={true}
                        sortServer={true}
                        paginationServer={true}
                        currentPage={currentPage}
                        paginationPerPage={perPage}
                        processing={loading}
                        noDataComponent={
                            <div className="text-muted-foreground p-8 text-center">No se encontraron resultados para los filtros seleccionados.</div>
                        }
                    />
                </div>
            </div>

            <ViewerModal
                show={!!viewerImage}
                image={viewerImage}
                onClose={() => setViewerImage(null)}
            />

            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                referencia={selectedReferencia}
            />
        </AppLayout>
    );
}
