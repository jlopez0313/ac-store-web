import { NAV_ITEMS } from '@/components/app-sidebar';
import { PageHeader } from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type Auth, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Panel principal',
		href: '/dashboard',
	},
];

const GROUP_META = {
	principal: { label: 'Principal', color: 'text-primary', bg: 'bg-primary/10' },
	operaciones: { label: 'Operaciones', color: 'text-chart-2', bg: 'bg-chart-2/10' },
	reportes: { label: 'Reportes', color: 'text-chart-4', bg: 'bg-chart-4/10' },
	admin: { label: 'Administración', color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export default function Dashboard({ auth }: { auth: Auth }) {

	const visibleItems = NAV_ITEMS.filter(item => auth.user && item.roles.includes(auth.user.role));
	const groups = ['principal', 'admin', 'operaciones', 'reportes'] as const;

	return (
		<AppLayout breadcrumbs={breadcrumbs} hideSidebar>
			<Head title="Panel principal" />

			<div className="p-4">
				<PageHeader
					title={`Bienvenido, ${auth.user.name?.split(' ')[0]}`}
					description="¿Qué deseas hacer hoy?"
				/>

				<div className="mt-8 px-4 mx-auto space-y-8">

					{groups.map(group => {
						const items = visibleItems.filter(i => i.group === group);
						if (items.length === 0) return null;
						const meta = GROUP_META[group];

						return (
							<section key={group}>
								<h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
									{meta.label}
								</h2>
								<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
									{items.map(item => (
										<Link
											key={item.url}
											href={item.url}
											className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center hover:border-primary/40 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5"
										>
											<div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.bg} transition-transform group-hover:scale-110`}>
												<item.icon className={`h-5 w-5 ${meta.color}`} />
											</div>
											<span className="text-sm font-medium leading-tight">{item.title}</span>
										</Link>
									))}
								</div>
							</section>
						);
					})}
				</div>
			</div>
		</AppLayout>
	);
}
