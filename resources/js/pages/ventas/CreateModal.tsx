import { FormButtons } from '@/components/ui/form/FormButtons';
import { SelectField } from '@/components/ui/form/SelectField';
import { TextAreaField } from '@/components/ui/form/TextAreaField';
import { Modal } from '@/components/ui/Modal';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { showAlert } from '@/plugins/sweetalert';

interface CreateModalProps {
	isOpen: boolean;
	onClose: () => void;
	accounts: any[];
	locals: any[];
	nextId: number;
}

export const CreateModal = ({ isOpen, onClose, accounts, locals, nextId }: CreateModalProps) => {
	const { isSuperAdmin } = useAuth();

	const { data, setData, post, processing, errors, reset } = useForm({
		user_id: [] as string[],
		cuenta_id: '',
		observaciones: '',
	});

	useEffect(() => {
		if (isOpen) reset();
	}, [isOpen, reset]);

	const submit: FormEventHandler = (e) => {
		e.preventDefault();
		post(route('ventas.store'), {
			onSuccess: () => {
				showAlert('success', 'Operación realizada correctamente');
				onClose();
			},
			onError: () => {
				showAlert('error', 'Error al procesar la solicitud');
			}
		});
	};

	// Filtrar locales por cuenta si es superadmin y ha seleccionado una cuenta
	const filteredLocals = isSuperAdmin 
		? (data.cuenta_id 
			? locals.filter((l: any) => l.accessible_cuenta_ids?.includes(Number(data.cuenta_id))) 
			: []) 
		: locals; 

	return (
		<Modal 
			show={isOpen} 
			closeable={true} 
			onClose={onClose} 
			title={data.user_id.length > 1 ? 'Crear Facturas Masivas' : `Nueva Factura de Venta #${nextId}`}
		>
			<form onSubmit={submit} className="p-6 space-y-6 bg-background">
				<div className="grid grid-cols-1 gap-6">
					{isSuperAdmin && (
						<SelectField
							name="cuenta_id"
							title="Cuenta / Empresa"
							required
							value={data.cuenta_id}
							onChange={(v) => {
								setData((d) => ({ ...d, cuenta_id: v as string, user_id: [] }));
							}}
							lista={accounts}
							item={{ idx: 'id', value: 'nombre' }}
							error={errors.cuenta_id}
						/>
					)}

					<SelectField
						name="user_id"
						title="Local (Destino)"
						required
						multiple={true}
						value={data.user_id}
						onChange={(v) => setData('user_id', v as string[])}
						lista={filteredLocals}
						item={{ idx: 'id', value: 'name' }}
						error={errors.user_id}
						disabled={isSuperAdmin && !data.cuenta_id}
					/>

					<TextAreaField
						name="observaciones"
						title="Observaciones (Opcional)"
						value={data.observaciones}
						onChange={(v) => setData('observaciones', v as string)}
						error={errors.observaciones}
						rows={3}
					/>
				</div>

				<div className="flex justify-end pt-4 gap-4">
					<FormButtons
						processing={processing}
						reset={onClose}
						buttons={{ cancel: true, submit: true }}
						labels={{ cancel: 'Cancelar', submit: 'Crear Factura' }}
					/>
				</div>
			</form>
		</Modal>
	);
};
