import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { type PrintRequest } from '@/lib/firebase';
import { Loader2, Printer } from 'lucide-react';

interface Props {
    request: PrintRequest;
    onPrint: (request: PrintRequest) => void;
    isProcessing: boolean;
}

export function PrintNotificationItem({ request, onPrint, isProcessing }: Props) {
    return (
        <DropdownMenuItem
            onClick={() => onPrint(request)}
            disabled={isProcessing}
            className="cursor-pointer gap-3 py-3"
        >
            {isProcessing ? (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-indigo-500" />
            ) : (
                <Printer className="h-4 w-4 flex-shrink-0 text-indigo-500" />
            )}
            <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold">Solicitud de impresión</span>
                <span className="text-muted-foreground text-[11px]">
                    {request.type === 'traslado' 
                        ? `Traslado #${request.traslado_id} — ${request.local_name}`
                        : `Factura #${request.venta_id} — ${request.local_name}`
                    }
                </span>
                <span className="text-muted-foreground text-[10px] capitalize">{request.type}</span>
            </div>
        </DropdownMenuItem>
    );
}
