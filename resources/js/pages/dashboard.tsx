import { GROUP_META, NAV_ITEMS } from '@/components/app-sidebar';
import { PageHeader } from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type Auth, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Panel principal',
		href: '/dashboard',
	},
];


export default function Dashboard({ auth }: { auth: Auth }) {

	const visibleItems = NAV_ITEMS.filter(item => auth.user && item.roles.includes(auth.user.role));
	const groups = ['principal', 'admin', 'operaciones', 'reportes'] as const;

	return (
		<AppLayout breadcrumbs={breadcrumbs} hideSidebar>
			<Head title="Panel principal" />

			<div className="p-6 md:p-10 max-w-6xl mx-auto">
				<div className="text-center mb-10">
					<h1 className="text-3xl font-bold tracking-tight mb-2">
						Bienvenido, {auth.user.name?.split(' ')[0]}
					</h1>
					<p className="text-muted-foreground text-lg">
						¿Qué deseas hacer hoy?
					</p>
				</div>

				<div className="space-y-12">
					{groups.map(group => {
						const items = visibleItems.filter(i => i.group === group);
						if (items.length === 0) return null;
						const meta = GROUP_META[group];

						return (
							<section key={group} className="space-y-6">
								<div className="flex items-center gap-4">
									<div className="h-px flex-1 bg-border/60"></div>
									<h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 whitespace-nowrap">
										{meta.label}
									</h2>
									<div className="h-px flex-1 bg-border/60"></div>
								</div>
								
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 justify-center">
									{items.map(item => {
										const isPost = item.method === 'post';
										const itemProps = {
											key: item.url,
											className: "group flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1.5 w-full"
										};

										const content = (
											<>
												<div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.bg} shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110`}>
													<item.icon className={`h-7 w-7 ${meta.color}`} />
												</div>
												<span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
													{item.title}
												</span>
											</>
										);

										if (isPost) {
											return (
												<button
													{...itemProps}
													onClick={() => router.post(item.url)}
												>
													{content}
												</button>
											);
										}

										return (
											<Link
												{...itemProps}
												href={item.url}
											>
												{content}
											</Link>
										);
									})}
								</div>
							</section>
						);
					})}
				</div>
			</div>
		</AppLayout>
	);
}
