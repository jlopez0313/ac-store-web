import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

type ThisForm = {
	nombre: string;
	estado: string;
	precio_suscripcion: string;
	fecha_vencimiento: string;
};

export const Form = ({ id, estados, setIsOpen, processing, onStore, onGetItem, onReload, default_account_price }: any) => {
	const { data, setData, errors, reset } = useForm<ThisForm>({
		nombre: '',
		estado: '1',
		precio_suscripcion: '',
		fecha_vencimiento: '',
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();
		try {
			await onStore(
				() => ({ url: route('api.cuentas.store') }),
				() => ({ url: route('api.cuentas.update', { cuenta: id }) }),
				data,
			);
			onReload();
		} catch (error) {
			console.error(error);
			showAlert('error', 'No se pudieron guardar los datos');
		}
	};

	useEffect(() => {
		if (!id) {
			reset();
			if (default_account_price) {
				setData('precio_suscripcion', default_account_price.toString());
			}
			return;
		}
		const getItem = async () => {
			const item: any = await onGetItem(
				() => ({ url: route('api.cuentas.show', { cuenta: id }) }),
				{},
			);
			if (item) {
				setData({
					nombre: item.nombre,
					estado: item.estado ? '1' : '0',
					precio_suscripcion: item.precio_suscripcion?.toString() || '',
					fecha_vencimiento: item.fecha_vencimiento || '',
				});
			}
		};
		getItem();
	}, [id]);

	return (
		<div className="pt-6 pb-12">
			<div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-3">
				<form onSubmit={submit}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<InputField
								name="nombre"
								title="Nombre"
								required
								value={data.nombre}
								onChange={(value) => setData('nombre', value as any)}
								error={errors.nombre}
							/>
						</div>

						<div>
							<SelectField
								name="estado"
								title="Estado"
								value={data.estado}
								onChange={(value) => setData('estado', value as any)}
								lista={estados}
								item={{ idx: 'id', value: 'name' }}
								error={errors.estado}
							/>
						</div>

						<div>
							<InputField
								name="precio_suscripcion"
								title="Precio Suscripción"
								type="number"
								value={data.precio_suscripcion}
								onChange={(value) => setData('precio_suscripcion', value as any)}
								error={(errors as any).precio_suscripcion}
							/>
						</div>

						<div>
							<InputField
								name="fecha_vencimiento"
								title="Fecha de Vencimiento"
								type="date"
								value={data.fecha_vencimiento}
								onChange={(value) => setData('fecha_vencimiento', value as any)}
								error={(errors as any).fecha_vencimiento}
							/>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-end gap-4">
						<FormButtons
							processing={processing}
							reset={() => setIsOpen(false)}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Guardar' }}
						/>
					</div>
				</form>
			</div>
		</div>
	);
};
