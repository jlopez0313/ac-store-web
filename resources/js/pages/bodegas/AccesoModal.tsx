import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputField } from '@/components/ui/form/InputField';
import { Modal } from '@/components/ui/Modal';
import { showAlert } from '@/plugins/sweetalert';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

export const AccesoModal = ({ isOpen, onClose, bodega, local, onSuccess }: any) => {
	const [canView, setCanView] = useState(false);
	const [canOrder, setCanOrder] = useState(false);
	const [descuento, setDescuento] = useState<string | number>(0);
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		if (isOpen && local) {
			setCanView(!!local.can_view);
			setCanOrder(!!local.can_order);
			setDescuento(local.descuento || 0);
		}
	}, [isOpen, local]);

	const handleSave = async () => {
		setProcessing(true);
		try {
			await axios.post(route('api.bodegas.accesos.update', { bodega: bodega.id, user_id: local.id }), {
				can_view: canView,
				can_order: canOrder,
				descuento: descuento
			});
			showAlert('success', 'Permisos actualizados.');
			if (onSuccess) onSuccess();
			onClose();
		} catch (error) {
			console.error('Error updating permisos:', error);
			showAlert('error', 'No se pudieron actualizar los permisos.');
		} finally {
			setProcessing(false);
		}
	};

	if (!local) return null;

	return (
		<Modal
			show={isOpen}
			onClose={onClose}
			closeable={true}
			title={`Configurar Permisos del Usuario: ${local.nombre}`}
			subtitle={`Hacia la bodega: ${bodega.nombre}`}
			maxWidth="md"
		>
			<div className="p-6 space-y-6">
				<div className="space-y-4">
					<div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer" onClick={() => setCanView(!canView)}>
						<Checkbox
							id="can_view"
							checked={canView}
							onCheckedChange={(v) => setCanView(v as boolean)}
						/>
						<div className="text-sm select-none">
							<p className="font-bold text-foreground">Ver Inventario</p>
							<p className="text-xs text-muted-foreground">Permite que este usuario consulte el stock actual de la bodega.</p>
						</div>
					</div>

					<div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer" onClick={() => setCanOrder(!canOrder)}>
						<Checkbox
							id="can_order"
							checked={canOrder}
							onCheckedChange={(v) => setCanOrder(v as boolean)}
						/>
						<div className="text-sm select-none">
							<p className="font-bold text-foreground">Pedir Stock</p>
							<p className="text-xs text-muted-foreground">Permite que este usuario genere solicitudes de traslado desde esta bodega.</p>
						</div>
					</div>

					<div className="pt-2">
						<InputField
							name="descuento"
							title="Valor de Descuento ($)"
							type="number"
							value={descuento.toString()}
							onChange={(v) => setDescuento(v)}
							placeholder="Ingresa el valor a descontar..."
						/>
						<p className="text-[11px] text-muted-foreground mt-1 px-1">
							Este monto se descontará automáticamente del precio de venta para este local.
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button variant="outline" onClick={onClose}>Cancelar</Button>
					<Button onClick={handleSave} disabled={processing}>
						{processing ? 'Guardando...' : 'Guardar Cambios'}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
