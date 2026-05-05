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
	vendedores: any[];
	nextId: number;
	onSuccess?: () => void;
}

export const CreateModal = ({ isOpen, onClose, accounts, locals, vendedores, nextId, onSuccess }: CreateModalProps) => {
	const { isSuperAdmin } = useAuth();

	const { data, setData, post, processing, errors, reset } = useForm({
		user_id: [] as string[],
		vendedor_ids: [] as string[],
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
				if (onSuccess) onSuccess();
			},
			onError: () => {
				showAlert('error', 'Error al procesar la solicitud');
			}
		});
	};

	const filteredLocals = isSuperAdmin 
		? (data.cuenta_id 
			? locals.filter((l: any) => l.accessible_cuenta_ids?.includes(Number(data.cuenta_id))) 
			: []) 
		: locals; 

	const selectedLocals = filteredLocals.filter((l: any) => 
        data.user_id.map(id => id.toString()).includes(l.id.toString())
    );
	const showVendedores = selectedLocals.some((l: any) => !!l.maneja_vendedores);

	const availableVendedores = vendedores.filter((v: any) => 
		data.user_id.map(id => id.toString()).includes(v.user_id?.toString())
	).map(v => ({ id: v.id, name: v.nombre }));

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
						onChange={(v) => {
							const newIds = v as string[];
							setData((d) => ({ ...d, user_id: newIds, vendedor_ids: [] }));
						}}
						lista={filteredLocals}
						item={{ idx: 'id', value: 'name' }}
						error={errors.user_id}
						disabled={isSuperAdmin && !data.cuenta_id}
					/>

					{showVendedores && (
						<SelectField
							name="vendedor_ids"
							title="Vendedores"
							required={true}
							multiple={true}
							value={data.vendedor_ids}
							onChange={(v) => setData('vendedor_ids', v as string[])}
							lista={availableVendedores}
							item={{ idx: 'id', value: 'name' }}
							error={errors.vendedor_ids}
							placeholder="Selecciona los vendedores para facturación individual"
						/>
					)}

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
