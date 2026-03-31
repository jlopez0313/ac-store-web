import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { SharedData, type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
	const { auth } = usePage<SharedData>().props;
	const isMobile = useIsMobile();
	const { state } = useSidebar();
	const cleanup = useMobileNavigation();

	const [open, setOpen] = useState(false);

	/* 
		const radicacion = useLiveQuery(() => db.notificaciones.get(1), []);
		const lastCheckpoint = useLiveQuery(
				() =>
						db.checkpoints.get({
								key: 'notificaciones',
								id: auth.user.id,
						}),
				[],
		);
	*/
	// const hasNewNotifications = !!radicacion && radicacion.fecha > (lastCheckpoint?.value ?? 0);
	const hasNewNotifications = false;

	return (
		<header className="flex justify-between border-sidebar-border/50 flex h-12 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">

			<div className="flex items-center gap-2">
				<SidebarTrigger className="-ml-1" />
				<Breadcrumbs breadcrumbs={breadcrumbs} />
			</div>

			<div className="flex items-center gap-3">
				<div className="hidden sm:flex flex-col items-end">
					<span className="text-xs font-medium leading-none">{auth.user.name}</span>
					<span className="text-xs text-muted-foreground capitalize leading-none mt-0.5">{auth.user.role}</span>
				</div>
				<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-primary text-primary-foreground">
					{auth.user.name?.charAt(0) ?? 'U'}
				</div>
				<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground cursor-pointer" asChild title='Salir'>
					<Link method="post" href={route('logout')} onClick={cleanup}>
						<LogOut className="h-4 w-4" />
					</Link>
				</Button>
			</div>
		</header>
	);
}
