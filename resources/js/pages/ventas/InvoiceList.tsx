import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileText, Search } from 'lucide-react';
import React from 'react';

interface InvoiceListProps {
    invoices: any[];
    selectedFactura: any;
    onSelectInvoice: (factura: any) => void;
    filters: any;
    onSearch: (value: string) => void;
    loading: boolean;
    meta: any;
    onPageChange: (page: number) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
    invoices,
    selectedFactura,
    onSelectInvoice,
    filters,
    onSearch
}) => {
    return (
        <Card className="lg:col-span-1 flex flex-col h-[calc(100vh-16rem)] border-slate-200 shadow-sm overflow-hidden dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Facturas de Venta</CardTitle>
            </CardHeader>

            <CardContent className="p-2 overflow-y-auto">
                <div className="space-y-1">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            defaultValue={filters.search}
                            placeholder="Buscar factura, local..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-500"
                            onBlur={(e) => onSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSearch(e.currentTarget.value);
                            }}
                        />
                    </div>

                    {invoices.length === 0 && (
                        <div className="text-center py-6 text-slate-500 text-sm italic">
                            No hay facturas registradas.
                        </div>
                    )}

                    {invoices.map((factura: any) => {
                        const isSelected = selectedFactura?.id === factura.id;
                        return (
                            <button
                                key={factura.id}
                                onClick={() => onSelectInvoice(factura)}
                                className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all ${isSelected
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-slate-200 scale-[1.02] dark:shadow-black/30'
                                    : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between pointer-events-none">
                                    <div className="flex items-center gap-2">
                                        <FileText className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="font-medium text-sm">Factura #{factura.id}</span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'capitalize',
                                            isSelected 
                                                ? 'bg-transparent text-white border-white/50' 
                                                : (factura.estado === 'cerrada' ? 'badge-closed' : 'badge-open')
                                        )}
                                    >
                                        {factura.estado}
                                    </Badge>
                                </div>
                                <div className="text-xs mt-1.5 opacity-70 px-6">
                                    {factura.local?.name} · {new Date(factura.fecha).toLocaleDateString()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
