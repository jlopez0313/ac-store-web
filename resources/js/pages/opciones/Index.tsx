import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Clock } from 'lucide-react';

import Heading from '@/components/heading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Opciones', href: '/opciones' }];

interface Cuenta {
    id: number;
    nombre: string;
}

interface Props {
    cuentas: Cuenta[];
    cuenta_id: number | null;
}

const OPTIONS = [
    {
        title: 'Horarios de ventas',
        description: 'Configura los horarios permitidos para que los usuarios locales agreguen referencias a facturas.',
        icon: Clock,
        url: '/opciones/horarios',
    },
];

export default function OpcionesIndex({ cuentas, cuenta_id }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isSuperadmin = auth.user?.is_superadmin;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Opciones" />

            <div className="px-4 py-6">
                <div className="flex items-start justify-between">
                    <Heading title="Opciones" description="Gestiona la configuración de la cuenta" />

                    {isSuperadmin && cuentas.length > 0 && (
                        <div className="w-56">
                            <Select
                                value={cuenta_id?.toString() ?? ''}
                                onValueChange={(value) => {
                                    window.location.href = `/opciones?cuenta_id=${value}`;
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cuentas.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {OPTIONS.map((option) => {
                        const href = cuenta_id ? `${option.url}?cuenta_id=${cuenta_id}` : option.url;
                        return (
                            <Link
                                key={option.url}
                                href={href}
                                className="group bg-card hover:border-primary/40 flex flex-col items-center gap-3 rounded-md border p-5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="bg-primary/10 flex h-11 w-11 items-center justify-center rounded-md transition-transform group-hover:scale-110">
                                    <option.icon className="text-primary h-5 w-5" />
                                </div>
                                <span className="text-sm leading-tight font-medium">{option.title}</span>
                                <p className="text-muted-foreground text-xs">{option.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
