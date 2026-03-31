import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState, useRef } from 'react';
import { showAlert } from '@/plugins/sweetalert';
import { useAuth } from '@/hooks/use-auth';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ThisForm = {
	codigo: string;
	marca: string;
	descripcion: string;
	categoria_id: string;
	cuenta_id: string;
	foto: File | null;
	_method?: string; // For Laravel form method spoofing with file uploads
};

export const Form = ({ id, categorias, cuentas, onClose, processing, onStore, onGetItem, onReload }: any) => {
	const { isSuperAdmin } = useAuth();
	
	// Previews the currently selected file or the absolute URL from the backend
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data, setData, errors, reset, setError } = useForm<ThisForm>({
		codigo: '',
		marca: '',
		descripcion: '',
		categoria_id: '',
		cuenta_id: '',
		foto: null,
	});

	const submit: FormEventHandler = async (e) => {
		e.preventDefault();
		
		// When using file uploads in Laravel API via PUT, the payload must actually
		// be sent as a POST with `_method=PUT` inside FormData, otherwise it drops files.
		const payload = { ...data };
		if (id) {
			payload._method = 'PUT';
		}

		try {
			await onStore(
				() => ({ url: route('referencias.store') }),
				// We target 'update' but we need to pass a special config to the api call
				// if we are doing this generically in the hook.
				// However, if the hook uses axios.post for the update internally if it detects a File object or FormData, 
				// it will work. Our useCrudPage hook needs to handle this natively. 
				// Let's ensure we use a POST request with the _method spoof since it's an upload
				() => ({ 
					url: route('referencias.update', { referencia: id }),
					method: 'post' // Force POST for Laravel FormData
				}),
				payload,
				// Indicates multi-part to useCrudPage hook -> it should wrap in FormData automatically
				true, 
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
			setImagePreview(null);
			if (fileInputRef.current) fileInputRef.current.value = '';
			return;
		}
		const getItem = async () => {
			const item: any = await onGetItem(
				() => ({ url: route('referencias.show', { referencia: id }) }),
				{},
			);
			if (item) {
				setData({
					codigo: item.codigo,
					marca: item.marca,
					descripcion: item.descripcion || '',
					categoria_id: item.categoria_id,
					cuenta_id: item.cuenta_id || '',
					foto: null, // Don't set the old file object, just the preview
				});
				setImagePreview(item.foto); // Backend URL
				if (fileInputRef.current) fileInputRef.current.value = '';
			}
		};
		getItem();
	}, [id]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setData('foto', file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const clearImage = () => {
		setData('foto', null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	return (
		<div className="pt-6 pb-12">
			<div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-3">
				<form onSubmit={submit} encType="multipart/form-data">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
						<InputField
							name="codigo"
							title="Código / SKU"
							required
							value={data.codigo}
							onChange={(val) => setData('codigo', val as string)}
							error={errors.codigo}
						/>

						<InputField
							name="marca"
							title="Marca"
							required
							value={data.marca}
							onChange={(val) => setData('marca', val as string)}
							error={errors.marca}
						/>

						<SelectField
							name="categoria_id"
							title="Categoría"
							required
							value={data.categoria_id}
							onChange={(val) => setData('categoria_id', val as string)}
							lista={categorias}
							item={{ idx: 'id', value: 'nombre' }}
							error={errors.categoria_id}
						/>

						{isSuperAdmin && (
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
						)}

						<div className="col-span-1 md:col-span-2">
							<InputField
								name="descripcion"
								title="Descripción (Opcional)"
								value={data.descripcion}
								onChange={(val) => setData('descripcion', val as string)}
								error={errors.descripcion}
							/>
						</div>

						{/* Image Upload Area */}
						<div className="col-span-1 md:col-span-2 mt-2">
							<Label className="block mb-2 text-sm font-medium text-slate-700">Foto del Producto (Opcional)</Label>
							<div className="flex flex-col sm:flex-row items-center gap-6">
								{/* Preview Circle */}
								<div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center relative group">
									{imagePreview ? (
										<>
											<img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
											<button 
												type="button" 
												onClick={clearImage}
												className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<X className="w-4 h-4" />
											</button>
										</>
									) : (
										<ImageIcon className="w-8 h-8 text-slate-400" />
									)}
								</div>

								{/* Upload Content */}
								<div className="flex-1 w-full space-y-2">
									<div className="flex items-center gap-3">
										<Button 
											type="button" 
											variant="outline" 
											onClick={() => fileInputRef.current?.click()}
										>
											<Upload className="w-4 h-4 mr-2" />
											Seleccionar Imagen
										</Button>
										<span className="text-xs text-slate-500">PNG, JPG hasta 2MB</span>
									</div>
									<input 
										type="file" 
										ref={fileInputRef}
										onChange={handleImageChange}
										accept="image/*"
										className="hidden"
									/>
									{errors.foto && <p className="text-sm text-red-500 mt-1">{errors.foto}</p>}
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<FormButtons
							processing={processing}
							reset={() => onClose()}
							buttons={{ cancel: true, submit: true }}
							labels={{ cancel: 'Cancelar', submit: 'Guardar Referencia' }}
						/>
					</div>
				</form>
			</div>
		</div>
	);
};
