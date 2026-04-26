import { Button } from '@/components/ui/button';
import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { SelectField } from '@/components/ui/form/SelectField';
import { Label } from '@/components/ui/label';
import { SwitchField } from '@/components/ui/form/SwitchField';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import axios from 'axios';

type ThisForm = {
    codigo: string;
    marca_id: string;
    descripcion: string;
    categoria_id: string;
    cuenta_id: string;
    foto: File | null;
    impreso: boolean;
    _method?: string; // For Laravel form method spoofing with file uploads
};

export const Form = ({ id, categorias, marcas, cuentas, onClose, processing, onStore, onGetItem, onReload }: any) => {
    const { user, isSuperAdmin } = useAuth();

    // Previews the currently selected file or the absolute URL from the backend
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, errors, reset, setError } = useForm<ThisForm>({
        codigo: '',
        marca_id: '',
        descripcion: '',
        categoria_id: '',
        cuenta_id: isSuperAdmin ? '' : (user?.cuenta_id?.toString() || ''),
        foto: null,
        impreso: true,
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
                () => ({ url: route('api.referencias.store') }),
                // We target 'update' but we need to pass a special config to the api call
                // if we are doing this generically in the hook.
                // However, if the hook uses axios.post for the update internally if it detects a File object or FormData,
                // it will work. Our useCrudPage hook needs to handle this natively.
                // Let's ensure we use a POST request with the _method spoof since it's an upload
                () => ({
                    url: route('api.referencias.update', { referencia: id }),
                    method: 'post', // Force POST for Laravel FormData
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
                },
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
            
            // If user is not superadmin, account is already set in useForm init
            // but if they are superadmin, we wait for them to select an account
            return;
        }
        const getItem = async () => {
            const item: any = await onGetItem({ id }, {});
            if (item) {
                setData({
                    codigo: item.codigo,
                    marca_id: item.marca?.id || '',
                    descripcion: item.descripcion || '',
                    categoria_id: item.categoria_id ?? item.categoria?.id ?? '',
                    cuenta_id: item.cuenta_id ?? item.cuenta?.id ?? '',
                    foto: null, // Don't set the old file object, just the preview
                    impreso: !!item.impreso,
                });
                setImagePreview(item.foto); // Backend URL
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        getItem();
    }, [id]);

    // Fetch next consecutive code when account changes (only for new records)
    useEffect(() => {
        if (!id && data.cuenta_id) {
            axios.get(route('api.referencias.next-code'), { params: { cuenta_id: data.cuenta_id } })
                .then((res: any) => setData('codigo', res.data.next_code))
                .catch((err: any) => console.error('Error fetching next code', err));
        }
    }, [id, data.cuenta_id]);

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
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                <form onSubmit={submit} encType="multipart/form-data">
                    <div className="text-foreground grid grid-cols-1 gap-6 md:grid-cols-2">
                        <InputField
                            name="codigo"
                            title="Código / SKU"
                            required
                            value={data.codigo}
                            onChange={(val) => setData('codigo', val as string)}
                            error={errors.codigo}
                        />

                        <SelectField
                            name="marca_id"
                            title="Marca"
                            required
                            value={data.marca_id}
                            onChange={(val) => setData('marca_id', val as string)}
                            lista={marcas}
                            item={{ idx: 'id', value: 'nombre' }}
                            error={errors.marca_id}
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

                        <div className="col-span-1">
                            <InputField
                                name="descripcion"
                                title="Descripción (Opcional)"
                                value={data.descripcion}
                                onChange={(val) => setData('descripcion', val as string)}
                                error={errors.descripcion}
                            />
                        </div>

                        <div className="col-span-1">
                            <SwitchField
                                name="impreso"
                                title="¿Ya está impreso?"
                                checked={data.impreso}
                                onChange={(val) => setData('impreso', val)}
                                processing={processing}
                            />
                        </div>

                        {/* Image Upload Area */}
                        <div className="col-span-1 mt-2 md:col-span-2">
                            <Label className="text-foreground mb-2 block text-sm font-medium">Foto del Producto (Opcional)</Label>
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                {/* Preview Circle */}
                                <div className="bg-muted border-border group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={clearImage}
                                                className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <ImageIcon className="text-muted-foreground h-8 w-8" />
                                    )}
                                </div>

                                {/* Upload Content */}
                                <div className="w-full flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Seleccionar Imagen
                                        </Button>
                                        <span className="text-muted-foreground text-xs">PNG, JPG hasta 2MB</span>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                    {errors.foto && <p className="mt-1 text-sm text-red-500">{errors.foto}</p>}
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
