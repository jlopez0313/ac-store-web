import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { TextAreaField } from '@/components/ui/form/TextAreaField';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

type ThisForm = {
	proveedor_id: string;
	estado: string;
	fecha_apertura: string;
	fecha_cierre: string;
	observaciones: string;
	flete: string;
	cuenta_id: string;
};

export const Form = ({ id, proveedores, cuentas, onClose, processing, onStore, onGetItem, onReload, next_id, onSuccess }: any) => {
	const { isSuperAdmin, isBodega } = useAuth();

	const { data, setData, errors, reset, setError } = useForm<ThisForm>({
		proveedor_id: '',
		estado: 'abierta',
		fecha_apertura: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm format for datetime-local
		fecha_cierre: '',
		observaciones: '',
		flete: '0',
		cuenta_id: '',
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();

		try {
			const response = await onStore(
				() => ({ url: route('api.compras.store') }),
				() => ({ url: route('api.compras.update', { compra: id }) }),
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

			if (onSuccess && response) {
				// The API returns the Resource inside `data.data` usually
				const savedFactura = response?.data?.data || response?.data;
				if (savedFactura) {
					onSuccess(savedFactura);
				}
			}

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
				() => ({ url: route('api.compras.show', { compra: id }) }),
				{},
			);
			if (item) {
				setData({
					proveedor_id: item.proveedor_id,
					estado: item.estado,
					fecha_apertura: item.fecha_apertura ? item.fecha_apertura.slice(0, 16) : '',
					fecha_cierre: item.fecha_cierre ? item.fecha_cierre.slice(0, 16) : '',
					observaciones: item.observaciones || '',
					flete: item.flete?.toString() || '0',
					cuenta_id: item.cuenta_id || '',
				});
			}
		};
		getItem();
	}, [id]);

	const estados = [
		{ id: 'abierta', nombre: 'Abierta' },
		{ id: 'cerrada', nombre: 'Cerrada' }
	];

	// Layout simplificado para Modal
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
							<SelectField
								name="proveedor_id"
								title="Proveedor"
								required
								value={data.proveedor_id}
								onChange={(val) => setData('proveedor_id', val as string)}
								lista={proveedores}
								item={{ idx: 'id', value: 'nombre' }}
								error={errors.proveedor_id}
							/>
						</div>

						<SelectField
							name="estado"
							title="Estado"
							required
							value={data.estado}
							onChange={(val) => setData('estado', val as string)}
							lista={estados}
							item={{ idx: 'id', value: 'nombre' }}
							error={errors.estado}
						/>

						<InputField
							name="fecha_apertura"
							title="Fecha de Apertura"
							type="datetime-local"
							required
							value={data.fecha_apertura}
							onChange={(val) => setData('fecha_apertura', val as string)}
							error={errors.fecha_apertura}
						/>

						{!isBodega && (
							<div className="col-span-1 md:col-span-2">
								<InputField
									name="flete"
									title="Valor del Flete"
									type="number"
									required
									value={data.flete}
									onChange={(val) => setData('flete', val as string)}
									error={errors.flete}
								/>
							</div>
						)}

						<div className="col-span-1 md:col-span-2 hidden">
							<InputField
								name="fecha_cierre"
								title="Fecha de Cierre (Opcional)"
								type="datetime-local"
								value={data.fecha_cierre}
								onChange={(val) => setData('fecha_cierre', val as string)}
								error={errors.fecha_cierre}
							/>
						</div>

						<div className="col-span-1 md:col-span-2">
							<TextAreaField
								name="observaciones"
								title="Observaciones"
								rows={3}
								value={data.observaciones}
								onChange={(val) => setData('observaciones', val as string)}
								error={errors.observaciones}
							/>
						</div>

					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<FormButtons
							processing={processing}
							reset={() => onClose()}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Guardar Factura' }}
						/>
					</div>
				</form>
			</div>
		</div>
	);
};
