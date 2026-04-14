import { FormButtons } from '@/components/ui/form/FormButtons';
import { InputField } from '@/components/ui/form/InputField';
import { showAlert } from '@/plugins/sweetalert';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

type ThisForm = {
    nombre: string;
};

export const Form = ({ id, onClose, processing, onStore, onGetItem, onReload }: any) => {
    const { data, setData, errors, reset, setError } = useForm<ThisForm>({
        nombre: '',
    });

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        try {
            await onStore(
                () => ({ url: route('api.marcas.store') }),
                () => ({ url: route('api.marcas.update', { marca: id }), method: 'put' }),
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
                () => ({ url: route('api.marcas.show', { marca: id }) }),
                {},
            );
            if (item) {
                setData({
                    nombre: item.nombre,
                });
            }
        };
        getItem();
    }, [id]);

    return (
        <div className="pt-6 pb-12 px-6">
            <form onSubmit={submit}>
                <div className="space-y-6 text-slate-900">
                    <InputField
                        name="nombre"
                        title="Nombre de la Marca"
                        required
                        value={data.nombre}
                        onChange={(val) => setData('nombre', val as string)}
                        error={errors.nombre}
                        placeholder="Ej. Nike, Adidas, etc."
                    />
                </div>

                <div className="mt-8 flex items-center justify-end gap-4">
                    <FormButtons
                        processing={processing}
                        reset={() => onClose()}
                        buttons={{ cancel: true, submit: true }}
                        labels={{ cancel: 'Cancelar', submit: 'Guardar Marca' }}
                    />
                </div>
            </form>
        </div>
    );
};
