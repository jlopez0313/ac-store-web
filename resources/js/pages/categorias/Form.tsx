import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

type ThisForm = {
	nombre: string;
	prefijo_sku: string;
	tipo_control: string;
	variaciones_json: string;
	maneja_subdivision: boolean;
	tipo_muestra: string;
};

export const Form = ({ id, tipos_control, tipos_muestras, onClose, processing, onStore, onGetItem, onReload }: any) => {
	const [manejaSub, setManejaSub] = useState(false);

	const { data, setData, errors, reset, setError } = useForm<ThisForm>({
		nombre: '',
		prefijo_sku: '',
		tipo_control: 'unidades',
		variaciones_json: '',
		maneja_subdivision: false,
		tipo_muestra: '',
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();

		// Map tipo_muestra back to subdivision_stock array from prop constants
		let subdivision_stock = null;
		if (data.maneja_subdivision && data.tipo_muestra) {
			const selectedType = tipos_muestras.find((t: any) => t.id === data.tipo_muestra);
			subdivision_stock = selectedType ? selectedType.labels : null;
		}

		// Prepare data for backend
		const payload = {
			...data,
			subdivision_stock,
			variaciones_json: data.variaciones_json ? data.variaciones_json.split(',').map(s => s.trim()) : [],
		};

		try {
			await onStore(
				() => ({ url: route('categorias.store') }),
				() => ({ url: route('categorias.update', { categoria: id }) }),
				payload,
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
			setManejaSub(false);
			return;
		}
		const getItem = async () => {
			const item: any = await onGetItem(
				() => ({ url: route('categorias.show', { categoria: id }) }),
				{},
			);
			if (item) {
				const hasSub = !!item.subdivision_stock;
				setManejaSub(hasSub);

				// Infer tipo_muestra from initial data using config types
				let tipo_muestra = '';
				if (hasSub && Array.isArray(item.subdivision_stock)) {
					const subArray = item.subdivision_stock;
					const found = tipos_muestras.find((t: any) =>
						t.labels.length === subArray.length &&
						t.labels.every((label: string) => subArray.includes(label))
					);
					if (found) tipo_muestra = found.id;
				}

				setData({
					nombre: item.nombre,
					prefijo_sku: item.prefijo_sku,
					tipo_control: item.tipo_control,
					variaciones_json: Array.isArray(item.variaciones_json) ? item.variaciones_json.join(', ') : '',
					maneja_subdivision: hasSub,
					tipo_muestra: tipo_muestra,
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
						<InputField
							name="nombre"
							title="Nombre de Categoría"
							required
							value={data.nombre}
							onChange={(val) => setData('nombre', val as any)}
							error={errors.nombre}
						/>

						<InputField
							name="prefijo_sku"
							title="Prefijo SKU (3 letras)"
							required
							maxLength={3}
							value={data.prefijo_sku}
							onChange={(val) => setData('prefijo_sku', (val as string).toUpperCase() as any)}
							error={errors.prefijo_sku}
						/>

						<SelectField
							name="tipo_control"
							title="Modo de Control"
							required
							value={data.tipo_control}
							onChange={(val) => setData('tipo_control', val as string)}
							lista={tipos_control}
							item={{ idx: 'id', value: 'name' }}
							error={errors.tipo_control}
						/>

						<InputField
							name="variaciones_json"
							title="Tallas / Variaciones Estándar (separadas por coma)"
							placeholder="S, M, L, XL"
							value={data.variaciones_json}
							onChange={(val) => setData('variaciones_json', val as any)}
							error={errors.variaciones_json}
						/>

						<div className="flex items-center space-x-4 mt-2">
							<Switch
								id="maneja_subdivision"
								checked={manejaSub}
								onCheckedChange={(checked) => {
									setManejaSub(checked);
									setData('maneja_subdivision', checked);
									if (!checked) setData('tipo_muestra', '');
								}}
							/>
							<Label htmlFor="maneja_subdivision" className="cursor-pointer">
								¿Maneja muestras?
							</Label>
						</div>

						{manejaSub && (
							<SelectField
								name="tipo_muestra"
								title="Tipo de muestra"
								required
								value={data.tipo_muestra}
								onChange={(val) => setData('tipo_muestra', val as string)}
								lista={tipos_muestras}
								item={{ idx: 'id', value: 'name' }}
								error={errors.tipo_muestra as any}
							/>
						)}
					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<FormButtons
							processing={processing}
							reset={() => onClose()}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Guardar Categoría' }}
						/>
					</div>
				</form>
			</div>
		</div>
	);
};
