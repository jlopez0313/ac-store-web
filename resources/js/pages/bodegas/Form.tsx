import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { SwitchField } from '@/components/ui/form/SwitchField';
import { SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

type ThisForm = {
	nombre: string;
	direccion: string;
	estado: string;
	imprimir_traslados: boolean;
	cuenta_id: string;
};

export const Form = ({ id, estados, cuentas, setIsOpen, processing, onStore, onGetItem, onReload }: any) => {
	const { isSuperAdmin } = useAuth();

	const { data, setData, errors, reset, setError } = useForm<ThisForm>({
		nombre: '',
		direccion: '',
		estado: '1',
		imprimir_traslados: false,
		cuenta_id: '',
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();
		try {
			await onStore(
				() => ({ url: route('api.bodegas.store') }),
				() => ({ url: route('api.bodegas.update', { bodega: id }) }),
				data,
				false,
				(err: any) => {
					if (err.response?.data?.errors) {
						const backendErrors = err.response.data.errors;
						Object.keys(backendErrors).forEach((key: any) => {
							setError(key as keyof ThisForm, backendErrors[key][0]);
						});
					}
				}
			);
			onReload();
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (!id) {
			reset();
			return;
		}
		const getItem = async () => {
			const item: any = await onGetItem(
				() => ({ url: route('api.bodegas.show', { bodega: id }) }),
				{},
			);
			if (item) {
				setData({
					nombre: item.nombre,
					direccion: item.direccion || '',
					estado: item.estado ? '1' : '0',
					imprimir_traslados: !!item.imprimir_traslados,
					cuenta_id: item.cuenta_id?.toString() || '',
				});
			}
		};
		getItem();
	}, [id]);

	return (
		<div className="p-6">
			<form onSubmit={submit}>
					<div className="grid grid-cols-1 gap-4 text-foreground">
						<InputField
							name="nombre"
							title="Nombre de la Bodega"
							required
							value={data.nombre}
							onChange={(value) => setData('nombre', value as any)}
							error={errors.nombre}
						/>

						<InputField
							name="direccion"
							title="Dirección"
							value={data.direccion}
							onChange={(value) => setData('direccion', value as any)}
							error={errors.direccion}
						/>

						{isSuperAdmin && (
							<SelectField
								name="cuenta_id"
								title="Cuenta / Empresa"
								required
								value={data.cuenta_id}
								onChange={(value) => setData('cuenta_id', value as string)}
								lista={cuentas}
								item={{ idx: 'id', value: 'name' }}
								error={errors.cuenta_id}
							/>
						)}

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

						<SwitchField
							name="imprimir_traslados"
							title="¿Imprimir traslados?"
							checked={data.imprimir_traslados}
							onChange={(val) => setData('imprimir_traslados', val)}
						/>
					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<FormButtons
							processing={processing}
							reset={() => setIsOpen(false)}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Guardar Bodega' }}
						/>
					</div>
			</form>
		</div>
	);
};
