import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Printer } from 'lucide-react';
import { usePrintAction } from '@/hooks/usePrintAction';
import { usePrintNotifications } from '@/hooks/usePrintNotifications';
import { PrintNotificationItem } from './PrintNotificationItem';

interface Props {
    cuentaId?: number | null;
}

export function PrintNotificationBell({ cuentaId }: Props) {
    const { handlePrint, processingKey } = usePrintAction(cuentaId);
    const { requests } = usePrintNotifications(cuentaId, handlePrint);

    if (requests.length === 0) {
        return (
            <div className="relative">
                <Bell className="text-muted-foreground h-4 w-4" />
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 cursor-pointer">
                    <Printer className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                        {requests.length}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                {requests.map((req) => (
                    <PrintNotificationItem
                        key={req.key}
                        request={req}
                        onPrint={handlePrint}
                        isProcessing={processingKey === req.key}
                    />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
