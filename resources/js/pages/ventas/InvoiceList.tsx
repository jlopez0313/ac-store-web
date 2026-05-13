import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectField } from '@/components/ui/form/SelectField';
import { cn } from '@/lib/utils';
import { FileText, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface InvoiceListProps {
    invoices: any[];
    selectedFactura: any;
    onSelectInvoice: (factura: any) => void;
    filters: any;
    onSearch: (value: string) => void;
    loading: boolean;
    meta: any;
    onPageChange: (page: number) => void;
    onFilterChange: (filters: any) => void;
    cuentas: any[];
    dynamicLocales: any[];
    isSuperAdmin: boolean;
    isAdmin: boolean;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, selectedFactura, onSelectInvoice, filters, onSearch, onFilterChange, loading, cuentas, dynamicLocales, isSuperAdmin, isAdmin }) => {
    const [searchQuery, setSearchQuery] = useState(filters.search);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== filters.search) {
                onSearch(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setSearchQuery(filters.search);
    }, [filters.search]);

    return (
        <Card className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden border-slate-200 shadow-sm lg:col-span-1 dark:border-slate-700">
            <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-tighter text-slate-500">Listado de Facturas</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="overflow-y-auto p-4 pt-2 space-y-4">
                {isAdmin && (
                    <div className="space-y-4">
                        {isSuperAdmin && (
                            <SelectField
                                title="Cuenta"
                                name="cuenta_id"
                                item={{ idx: 'id', value: 'nombre' }}
                                lista={cuentas}
                                value={filters.cuenta_id}
                                onChange={(val) => onFilterChange({ cuenta_id: val, local_id: '' })}
                                error={undefined}
                                placeholder="Seleccionar Cuenta"
                            />
                        )}

                        <SelectField
                            title="Local"
                            name="local_id"
                            item={{ idx: 'id', value: 'name' }}
                            lista={dynamicLocales}
                            value={filters.local_id}
                            onChange={(val) => onFilterChange({ local_id: val })}
                            error={undefined}
                            placeholder="Todos los locales"
                        />

                    </div>
                )}

                <div className="space-y-4">
                    <SelectField
                        title="Estado"
                        name="estado"
                        item={{ idx: 'id', value: 'nombre' }}
                        lista={[
                            { id: 'abierta', nombre: 'Abierta' },
                            { id: 'cerrada', nombre: 'Cerrada' },
                        ]}
                        value={filters.estado}
                        onChange={(val) => onFilterChange({ estado: val })}
                        error={undefined}
                        placeholder="Filtrar por estado"
                    />

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                </div>

                <div className="space-y-1 p-1">
                    <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <input
                                id="search-invoice"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar factura #"
                                className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSearch(searchQuery);
                                }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-6 text-center text-sm text-slate-500 italic">Cargando facturas...</div>
                    ) : (
                        invoices.length === 0 && <div className="py-6 text-center text-sm text-slate-500 italic">No hay facturas registradas.</div>
                    )}

                    {invoices.map((factura: any) => {
                        const isSelected = selectedFactura?.id === factura.id;
                        return (
                            <button
                                key={factura.id}
                                onClick={() => onSelectInvoice(factura)}
                                className={`mb-1 w-full rounded-md px-3 py-3 text-left transition-all ${isSelected
                                    ? 'bg-primary text-primary-foreground scale-[1.02] shadow-lg shadow-slate-200 dark:shadow-black/30'
                                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="pointer-events-none flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">Factura #{factura.numero ?? factura.id}</span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'capitalize',
                                            isSelected
                                                ? 'border-white/50 bg-transparent text-white'
                                                : factura.estado === 'cerrada'
                                                    ? 'badge-closed'
                                                    : 'badge-open',
                                        )}
                                    >
                                        {factura.estado}
                                    </Badge>
                                </div>
                                <div className="mt-1.5 px-6 text-xs opacity-70">
                                    {factura.local?.name} {factura.vendedor && factura.vendedor !== factura.local?.name ? `(${factura.vendedor})` : ''} · {new Date(factura.fecha).toLocaleDateString()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
