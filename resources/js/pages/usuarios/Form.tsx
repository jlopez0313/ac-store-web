import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

type ThisForm = {
	name: string;
	username: string;
	email: string;
	password: string;
	role: string;
	cuenta_id: string;
	estado: string;
};

export const Form = ({ id, roles, cuentas, estados, onClose, processing, onStore, onGetItem, onReload }: any) => {
	const { isSuperAdmin } = useAuth();
	const { data, setData, errors, reset, setError } = useForm<ThisForm>({
		name: '',
		username: '',
		email: '',
		password: '',
		role: '',
		cuenta_id: '',
		estado: '1',
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();
		try {
			await onStore(
				() => ({ url: route('usuarios.store') }),
				() => ({ url: route('usuarios.update', { usuario: id }) }),
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
			onClose();
		} catch (error: any) {
			console.error(error);
			showAlert('error', 'No se pudieron guardar los datos');
		}
	};

	useEffect(() => {
		if (!id) {
			reset();
			return;
		}
		const getItem = async () => {
			const item: any = await onGetItem(
				() => ({ url: route('usuarios.show', { usuario: id }) }),
				{},
			);
			if (item) {
				setData({
					name: item.name,
					username: item.username,
					email: item.email,
					password: '', // Empty password on edit
					role: item.role || '',
					cuenta_id: item.cuenta_id?.toString() || '',
					estado: item.estado ? '1' : '0',
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

						<SelectField
							name="cuenta_id"
							title="Cuenta / Empresa"
							value={data.cuenta_id}
							onChange={(value) => setData('cuenta_id', value as string)}
							lista={cuentas}
							item={{ idx: 'id', value: 'name' }}
							error={errors.cuenta_id}
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
