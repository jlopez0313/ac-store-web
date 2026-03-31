import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
	children: React.ReactNode;
	name?: string;
	title?: string;
	description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
			style={{ background: 'var(--gradient-hero)' }}
		>

			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
					style={{ background: 'hsl(210 90% 55%)', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }} />
				<div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10"
					style={{ background: 'hsl(210 90% 55%)', filter: 'blur(60px)', transform: 'translate(-30%, 30%)' }} />
			</div>


			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col items-center gap-4">
						<Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
							<div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
								<AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
							</div>
							<span className="sr-only">{title}</span>
						</Link>

						<div className="space-y-2 text-center">
							<h1 className="text-xl font-medium">{title}</h1>
							<p className="text-muted-foreground text-center text-sm" style={{ color: 'hsl(220 30% 70%)' }}>{description}</p>
						</div>
					</div>

					<Card className="border-0 shadow-2xl">
						<CardContent className="p-8 space-y-5">
							{children}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
