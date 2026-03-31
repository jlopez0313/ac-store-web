import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { showAlert } from '@/plugins/sweetalert';
import { useAuth } from '@/hooks/use-auth';

type ThisForm = {
	nombre: string;
	tipo_documento: string;
	documento: string;
	telefono: string;
	correo: string;
	cuenta_id: string;
};

export const Form = ({ id, tiposDocs, cuentas, onClose, processing, onStore, onGetItem, onReload }: any) => {
	const { isSuperAdmin } = useAuth();
	
	const { data, setData, errors, reset, setError } = useForm<ThisForm>({
		nombre: '',
		tipo_documento: '',
		documento: '',
		telefono: '',
		correo: '',
		cuenta_id: '',
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();

		try {
			await onStore(
				() => ({ url: route('proveedores.store') }),
				() => ({ url: route('proveedores.update', { proveedore: id }) }), // proveedore is the default route binding variable
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
		} catch (error) {
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
				() => ({ url: route('proveedores.show', { proveedore: id }) }),
				{},
			);
			if (item) {
				setData({
					nombre: item.nombre,
					tipo_documento: item.tipo_documento,
					documento: item.documento,
					telefono: item.telefono || '',
					correo: item.correo || '',
					cuenta_id: item.cuenta_id || '',
				});
			}
		};
		getItem();
	}, [id]);

	return (
		<div className="pt-6 pb-12">
			<div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-3">
				<form onSubmit={submit}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
						
                        {isSuperAdmin && (
							<div className="col-span-1 md:col-span-2">
                                <SelectField
                                    name="cuenta_id"
                                    title="Cuenta / Empresa"
                                    required
                                    value={data.cuenta_id}
                                    onChange={(val) => setData('cuenta_id', val as string)}
                                    lista={cuentas}
                                    item={{ idx: 'id', value: 'nombre' }}
                                    error={errors.cuenta_id}
                                />
                            </div>
						)}

						<div className="col-span-1 md:col-span-2">
                            <InputField
                                name="nombre"
                                title="Nombre o Razón Social"
                                required
                                value={data.nombre}
                                onChange={(val) => setData('nombre', val as string)}
                                error={errors.nombre}
                            />
                        </div>

						<SelectField
							name="tipo_documento"
							title="Tipo de Documento"
							required
							value={data.tipo_documento}
							onChange={(val) => setData('tipo_documento', val as string)}
							lista={tiposDocs}
							item={{ idx: 'id', value: 'nombre' }}
							error={errors.tipo_documento}
						/>

                        <InputField
							name="documento"
							title="Número de Documento / NIT"
							required
							value={data.documento}
							onChange={(val) => setData('documento', val as string)}
							error={errors.documento}
						/>

                        <InputField
							name="telefono"
							title="Teléfono (Opcional)"
							value={data.telefono}
							onChange={(val) => setData('telefono', val as string)}
							error={errors.telefono}
						/>

                        <InputField
							name="correo"
							title="Correo Electrónico (Opcional)"
                            type="email"
							value={data.correo}
							onChange={(val) => setData('correo', val as string)}
							error={errors.correo}
						/>

					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<FormButtons
							processing={processing}
							reset={() => onClose()}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Guardar Proveedor' }}
						/>
					</div>
				</form>
			</div>
		</div>
	);
};
