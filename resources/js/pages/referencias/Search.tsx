import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/form/SelectField';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
            name: 'Código',
            selector: (row: any) => row.codigo,
            sortable: true,
        },
        {
            name: 'Marca',
            selector: (row: any) => row.marca,
            sortable: true,
        },
        {
            name: 'Descripción',
            selector: (row: any) => row.descripcion,
            wrap: true,
            width: '350px',
        },
        {
            name: 'Talla',
            selector: (row: any) => row.talla,
            sortable: true,
            width: '100px',
        },
        {
            name: 'Bodega',
            selector: (row: any) => row.bodega,
            sortable: true,
        },
        {
            name: 'Stock',
            selector: (row: any) => row.stock,
            sortable: true,
            width: '100px',
            cell: (row: any) => (
                <span className={`font-bold ${row.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {row.stock}
                </span>
            ),
        },
        ...(isSuperAdmin ? [{
            name: 'Cuenta',
            selector: (row: any) => row.cuenta,
        }] : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Búsqueda de Referencias" />

            <div className="p-4 space-y-6">
                <PageHeader
                    title="Búsqueda de Referencias"
                    description="Busque disponibilidad de productos por marca, código, referencia o talla."
                />

                <Card className="border-border/50 shadow-sm overflow-visible">
                    <CardContent className="p-4">
                        <form onSubmit={onSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                            {isSuperAdmin && (
                                <div className="lg:col-span-2">
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

                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="marca">Marca</Label>
                                <Input
                                    id="marca"
                                    placeholder="Ej: Nike"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="h-10 bg-white"
                                />
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="codigo">Código</Label>
                                <Input
                                    id="codigo"
                                    placeholder="Ej: 12345"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    className="h-10 bg-white"
                                />
                            </div>

                            <div className="space-y-2 lg:col-span-3">
                                <Label htmlFor="referencia">Referencia / Descripción</Label>
                                <Input
                                    id="referencia"
                                    placeholder="Ej: Tenis Runner"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className="h-10 bg-white"
                                />
                            </div>

                            <div className="space-y-2 lg:col-span-1">
                                <Label htmlFor="talla">Talla</Label>
                                <Input
                                    id="talla"
                                    placeholder="Ej: 38"
                                    value={talla}
                                    onChange={(e) => setTalla(e.target.value)}
                                    className="h-10 bg-white"
                                />
                            </div>

                            <div className="flex gap-2 min-w-[120px] lg:col-span-2">
                                <Button type="submit" className="flex-1 h-10" disabled={loading}>
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <SearchIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleClear} size="icon" className="h-10 w-10 shrink-0" title="Limpiar filtros" disabled={loading}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="bg-background rounded-xl shadow-xs border border-border overflow-hidden">
                    <DataGrid
                        data={results}
                        columns={columns}
                        total={total}
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
                            <div className="p-8 text-center text-muted-foreground">
                                No se encontraron resultados para los filtros seleccionados.
                            </div>
                        }
                    />
                </div>
            </div>
        </AppLayout>
    );
}
