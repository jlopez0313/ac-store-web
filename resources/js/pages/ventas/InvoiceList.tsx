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

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, selectedFactura, onSelectInvoice, filters, onSearch }) => {
    return (
        <Card className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden border-slate-200 shadow-sm lg:col-span-1 dark:border-slate-700">
            <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-sm">Facturas de Venta</CardTitle>
            </CardHeader>

            <CardContent className="overflow-y-auto p-2">
                <div className="space-y-1">
                    <div className="relative mb-2">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            defaultValue={filters.search}
                            placeholder="Buscar factura, local..."
                            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-500"
                            onBlur={(e) => onSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSearch(e.currentTarget.value);
                            }}
                        />
                    </div>

                    {invoices.length === 0 && <div className="py-6 text-center text-sm text-slate-500 italic">No hay facturas registradas.</div>}

                    {invoices.map((factura: any) => {
                        const isSelected = selectedFactura?.id === factura.id;
                        return (
                            <button
                                key={factura.id}
                                onClick={() => onSelectInvoice(factura)}
                                className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition-all ${
                                    isSelected
                                        ? 'bg-primary text-primary-foreground scale-[1.02] shadow-lg shadow-slate-200 dark:shadow-black/30'
                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="pointer-events-none flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">Factura #{factura.id}</span>
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
