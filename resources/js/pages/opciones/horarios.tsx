import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Opciones', href: '/opciones' },
    { title: 'Horarios', href: '/opciones/horarios' },
];

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
] as const;

type HorariosVentas = Record<string, string[][]>;

interface Cuenta {
    id: number;
    nombre: string;
}

interface Props {
    horarios_ventas: HorariosVentas;
    bloquear_festivos: boolean;
    cuentas: Cuenta[];
    cuenta_id: number | null;
}

export default function OpcionesHorarios({ horarios_ventas, bloquear_festivos, cuentas, cuenta_id }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isSuperadmin = auth.user?.is_superadmin;

    const { data, setData, put, processing, recentlySuccessful } = useForm({
        horarios_ventas: horarios_ventas,
        bloquear_festivos: bloquear_festivos,
        cuenta_id: cuenta_id,
    });

    useEffect(() => {
        setData('cuenta_id', cuenta_id);
    }, [cuenta_id]);

    const updateRange = (day: string, rangeIndex: number, pos: 0 | 1, value: string) => {
        const updated = { ...data.horarios_ventas };
        updated[day] = [...(updated[day] || [])];
        updated[day][rangeIndex] = [...updated[day][rangeIndex]];
        updated[day][rangeIndex][pos] = value;
        setData('horarios_ventas', updated);
    };

    const addRange = (day: string) => {
        const updated = { ...data.horarios_ventas };
        updated[day] = [...(updated[day] || []), ['08:00', '17:00']];
        setData('horarios_ventas', updated);
    };

    const removeRange = (day: string, rangeIndex: number) => {
        const updated = { ...data.horarios_ventas };
        updated[day] = updated[day].filter((_, i) => i !== rangeIndex);
        setData('horarios_ventas', updated);
    };

    const handleCuentaChange = (value: string) => {
        setData('cuenta_id', parseInt(value));
        router.get('/opciones/horarios', { cuenta_id: value }, { preserveState: false });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('opciones.horarios.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Opciones - Horarios" />

            <div className="px-4 py-6">
                <div className="mx-auto max-w-2xl space-y-6">
                    <div className="flex flex-col gap-6">
                        <HeadingSmall
                            title="Horarios de ventas"
                            description="Configura los horarios permitidos para que los usuarios locales puedan agregar referencias a facturas."
                        />

                        {isSuperadmin && cuentas.length > 0 && (
                            <div className="bg-muted/30 border-border rounded-xl border p-4">
                                <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Cuenta a configurar
                                </Label>
                                <Select value={cuenta_id?.toString() ?? ''} onValueChange={handleCuentaChange}>
                                    <SelectTrigger className="w-full sm:w-[300px]">
                                        <SelectValue placeholder="Selecciona una cuenta para ver sus horarios" />
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

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-4">
                            {DAYS.map(({ key, label }) => {
                                const ranges = data.horarios_ventas[key] || [];
                                return (
                                    <div key={key} className="rounded-lg border p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label className="text-sm font-medium">{label}</Label>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => addRange(key)}>
                                                <Plus className="mr-1 h-4 w-4" />
                                                Agregar rango
                                            </Button>
                                        </div>

                                        {ranges.length === 0 ? (
                                            <p className="text-muted-foreground text-sm italic">Cerrado</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {ranges.map((range, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            value={range[0]}
                                                            onChange={(e) => updateRange(key, i, 0, e.target.value)}
                                                            className="w-32"
                                                        />
                                                        <span className="text-muted-foreground">a</span>
                                                        <Input
                                                            type="time"
                                                            value={range[1]}
                                                            onChange={(e) => updateRange(key, i, 1, e.target.value)}
                                                            className="w-32"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeRange(key, i)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label className="text-sm font-medium">Bloquear en días festivos</Label>
                                <p className="text-muted-foreground text-sm">
                                    Impide que los usuarios locales agreguen referencias en festivos de Colombia.
                                </p>
                            </div>
                            <Switch checked={data.bloquear_festivos} onCheckedChange={(checked) => setData('bloquear_festivos', checked)} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing || (isSuperadmin && !data.cuenta_id)}>
                                Guardar cambios
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-muted-foreground text-sm">Guardado.</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
