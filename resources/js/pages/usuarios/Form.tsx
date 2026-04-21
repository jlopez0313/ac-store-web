import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { SwitchField } from '@/components/ui/form/SwitchField';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';

type ThisForm = {
    name: string;
    username: string;
    documento: string;
    email: string;
    password: string;
    role: string;
    cuenta_id: string;
    estado: string;
    impresion_principal: boolean;
    nombre_impresora: string;
    country_id: string;
    state_id: string;
    ciudad_id: string;
    precio_suscripcion: string;
    fecha_vencimiento: string;
};

export const Form = ({ id, roles, cuentas, estados, onClose, processing, onStore, onGetItem, onReload, default_user_price }: any) => {
    const { isSuperAdmin } = useAuth();
    const { data, setData, errors, reset, setError } = useForm<ThisForm>({
        name: '',
        username: '',
        documento: '',
        email: '',
        password: '',
        role: '',
        cuenta_id: '',
        estado: '1',
        impresion_principal: false,
        nombre_impresora: '',
        country_id: '',
        state_id: '',
        ciudad_id: '',
        precio_suscripcion: '',
        fecha_vencimiento: '',
    });

    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    const loadCountries = async () => {
        try {
            const res = await axios.get(route('api.geography.countries'));
            setCountries(res.data);
        } catch (error) {
            console.error('Error loading countries', error);
        }
    };

    const loadStates = async (countryId: string) => {
        if (!countryId) {
            setStates([]);
            setCities([]);
            setData((prev) => ({ ...prev, state_id: '', ciudad_id: '' }));
            return;
        }
        try {
            const res = await axios.get(route('api.geography.states', { country_id: countryId }));
            setStates(res.data);
        } catch (error) {
            console.error('Error loading states', error);
        }
    };

    const loadCities = async (stateId: string) => {
        if (!stateId) {
            setCities([]);
            setData((prev) => ({ ...prev, ciudad_id: '' }));
            return;
        }
        try {
            const res = await axios.get(route('api.geography.cities', { state_id: stateId }));
            setCities(res.data);
        } catch (error) {
            console.error('Error loading cities', error);
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        try {
            await onStore(
                () => ({ url: route('api.usuarios.store') }),
                () => ({ url: route('api.usuarios.update', { usuario: id }) }),
                data,
                false,
                (err: any) => {
                    if (err.response?.data?.errors) {
                        const backendErrors = err.response.data.errors;
                        Object.keys(backendErrors).forEach((key: any) => {
                            setError(key as keyof ThisForm, backendErrors[key][0]);
                        });
                    }
                },
            );
            onReload();
            onClose();
        } catch (error: any) {
            console.error(error);
            showAlert('error', 'No se pudieron guardar los datos');
        }
    };

    useEffect(() => {
        loadCountries();
    }, []);

    useEffect(() => {
        if (!id) {
            reset();
            setStates([]);
            setCities([]);
            if (default_user_price) {
                setData('precio_suscripcion', default_user_price.toString());
            }
            return;
        }
        const getItem = async () => {
            const item: any = await onGetItem(() => ({ url: route('api.usuarios.show', { usuario: id }) }), {});
            if (item) {
                const countryId = item.ciudad?.state?.country_id?.toString() || '';
                const stateId = item.ciudad?.state_id?.toString() || '';
                const ciudadId = item.ciudad_id?.toString() || '';

                // Trigger loads sequentially for pre-population
                if (countryId) loadStates(countryId);
                if (stateId) loadCities(stateId);

                setData({
                    name: item.name,
                    username: item.username,
                    documento: item.documento || '',
                    email: item.email,
                    password: '', // Empty password on edit
                    role: item.role || '',
                    cuenta_id: item.cuenta_id?.toString() || '',
                    estado: item.estado ? '1' : '0',
                    impresion_principal: !!item.impresion_principal,
                    nombre_impresora: item.nombre_impresora || '',
                    country_id: countryId,
                    state_id: stateId,
                    ciudad_id: ciudadId,
                    precio_suscripcion: item.precio_suscripcion?.toString() || '',
                    fecha_vencimiento: item.fecha_vencimiento || '',
                });
            }
        };
        getItem();
    }, [id]);

    return (
        <div className="pt-6 pb-12">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InputField
                            name="name"
                            title="Nombre Completo"
                            required
                            value={data.name}
                            onChange={(value) => setData('name', value as any)}
                            error={errors.name}
                        />

                        <InputField
                            name="username"
                            title="Nombre de Usuario"
                            required
                            value={data.username}
                            onChange={(value) => setData('username', value as any)}
                            error={errors.username}
                        />

                        <InputField
                            name="documento"
                            title="Documento / ID"
                            value={data.documento}
                            onChange={(value) => setData('documento', value as any)}
                            error={errors.documento}
                        />

                        <InputField
                            name="email"
                            title="Correo Electrónico"
                            type="email"
                            required
                            value={data.email}
                            onChange={(value) => setData('email', value as any)}
                            error={errors.email}
                        />

                        <InputField
                            name="password"
                            title="Contraseña"
                            type="password"
                            required={!id}
                            placeholder={id ? 'Dejar en blanco para no cambiar' : '********'}
                            value={data.password}
                            onChange={(value) => setData('password', value as any)}
                            error={errors.password}
                        />

                        <SelectField
                            name="role"
                            title="Rol"
                            required
                            value={data.role}
                            onChange={(value) => setData('role', value as string)}
                            lista={roles}
                            item={{ idx: 'id', value: 'name' }}
                            error={errors.role}
                        />

                        {!['local', 'superadmin'].includes(data.role) && (
                            <SelectField
                                name="cuenta_id"
                                title="Cuenta / Empresa"
                                value={data.cuenta_id}
                                onChange={(value) => setData('cuenta_id', value as string)}
                                lista={cuentas}
                                item={{ idx: 'id', value: 'name' }}
                                error={errors.cuenta_id}
                            />
                        )}

                        <SelectField
                            name="country_id"
                            title="País"
                            value={data.country_id}
                            onChange={(value) => {
                                setData('country_id', value as string);
                                loadStates(value as string);
                            }}
                            lista={countries}
                            item={{ idx: 'id', value: 'name' }}
                            error={errors.country_id}
                        />

                        <SelectField
                            name="state_id"
                            title="Departamento"
                            value={data.state_id}
                            onChange={(value) => {
                                setData('state_id', value as string);
                                loadCities(value as string);
                            }}
                            lista={states}
                            item={{ idx: 'id', value: 'name' }}
                            error={errors.state_id}
                        />

                        <SelectField
                            name="ciudad_id"
                            title="Ciudad"
                            value={data.ciudad_id}
                            onChange={(value) => setData('ciudad_id', value as string)}
                            lista={cities}
                            item={{ idx: 'id', value: 'name' }}
                            error={errors.ciudad_id}
                        />

                        <SelectField
                            name="estado"
                            title="Estado"
                            required
                            value={data.estado}
                            onChange={(value) => setData('estado', value as string)}
                            lista={estados}
                            item={{ idx: 'id', value: 'name' }}
                            error={errors.estado}
                        />

                        <InputField
                            name="precio_suscripcion"
                            title="Precio Suscripción"
                            type="number"
                            value={data.precio_suscripcion}
                            onChange={(value) => setData('precio_suscripcion', value as any)}
                            error={(errors as any).precio_suscripcion}
                        />

                        <InputField
                            name="fecha_vencimiento"
                            title="Fecha de Vencimiento"
                            type="date"
                            value={data.fecha_vencimiento}
                            onChange={(value) => setData('fecha_vencimiento', value as any)}
                            error={(errors as any).fecha_vencimiento}
                        />

                        <SwitchField
                            processing={processing}
                            name="impresion_principal"
                            title="Impresión principal"
                            checked={data.impresion_principal}
                            onChange={(value) => setData('impresion_principal', value)}
                        />

                        {data.impresion_principal && (
                            <InputField
                                name="nombre_impresora"
                                title="Nombre de la Impresora (QZ Tray)"
                                placeholder="ej. Epson-TM-T20"
                                value={data.nombre_impresora}
                                onChange={(value) => setData('nombre_impresora', value as string)}
                                error={(errors as any).nombre_impresora}
                            />
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-4">
                        <FormButtons
                            processing={processing}
                            reset={() => onClose()}
                            buttons={{ cancel: true, submit: true }}
                            labels={{ cancel: 'Cancelar', submit: 'Guardar' }}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};
