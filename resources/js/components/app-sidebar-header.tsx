import { Breadcrumbs } from '@/components/breadcrumbs';
import { PrintNotificationBell } from '@/components/print/PrintNotificationBell';
import { SystemNotificationsBell } from '@/components/system-notifications-bell';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { SharedData, type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage<SharedData>().props;
    const isMobile = useIsMobile();
    const { state } = useSidebar();
    const cleanup = useMobileNavigation();

    const showPrintBell = auth.user.impresion_principal || auth.user.is_superadmin;

    return (
        <header className="border-sidebar-border/50 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-3">
                <SystemNotificationsBell />
                {showPrintBell && <PrintNotificationBell cuentaId={auth.user.cuenta_id} />}
                <div className="hidden flex-col items-end sm:flex">
                    <span className="text-xs leading-none font-medium">{auth.user.name}</span>
                    <span className="text-muted-foreground mt-0.5 text-xs leading-none capitalize">{auth.user.role}</span>
                </div>
                <div className="bg-primary text-primary-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {auth.user.name?.charAt(0) ?? 'U'}
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 cursor-pointer" asChild title="Salir">
                    <Link method="post" href={route('logout')} onClick={cleanup}>
                        <LogOut className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </header>
    );
}
