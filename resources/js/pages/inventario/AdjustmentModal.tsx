import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Loader2, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdjustmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	referencia: any;
	estanteria: {
		id: number;
		nombre: string;
		bodega_nombre: string;
	};
	items: any[]; // Sizes and current stocks for this shelf
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	referencia,
	estanteria,
	items,
}) => {
	const [form, setForm] = useState({
		precio_compra: 0,
		precio_venta: 0,
		observacion: '',
		detalles: [] as { talla: string; stock: number }[],
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen && items.length > 0) {
			setForm({
				precio_compra: items[0].precio_compra || 0,
				precio_venta: items[0].precio_venta || 0,
				observacion: '',
				detalles: items.map((item) => ({
					talla: item.talla,
					stock: item.stock,
				})),
			});
		}
	}, [isOpen, items]);

	const handleStockChange = (talla: string, value: string) => {
		const newStock = parseInt(value) || 0;
		setForm((prev) => ({
			...prev,
			detalles: prev.detalles.map((d) => (d.talla === talla ? { ...d, stock: newStock } : d)),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.post(route('api.inventario.ajustar'), {
				referencia_id: referencia.id,
				estanteria_id: estanteria.id,
				precio_compra: form.precio_compra,
				precio_venta: form.precio_venta,
				observacion: form.observacion,
				detalles: form.detalles,
			});
			showAlert('success', 'Inventario ajustado correctamente');
			onSuccess();
			onClose();
		} catch (error: any) {
			console.error('Error adjusting inventory:', error);
			showAlert('error', error.response?.data?.message || 'No se pudo ajustar el inventario');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal show={isOpen} onClose={onClose} title="Ajustar Inventario" maxWidth="3xl" closeable={true} className='max-h-[90vh] overflow-y-auto'>
			<form onSubmit={handleSubmit} className="p-6 space-y-6">
				<div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Producto</span>
						<span className="font-semibold">{referencia.codigo} - {referencia.descripcion}</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Ubicación</span>
						<span className="font-semibold">{estanteria.bodega_nombre} / {estanteria.nombre}</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="precio_compra">Precio de Compra</Label>
						<Input
							id="precio_compra"
							type="number"
							value={form.precio_compra}
							onChange={(e) => setForm({ ...form, precio_compra: Number(e.target.value) })}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="precio_venta">Precio de Venta</Label>
						<Input
							id="precio_venta"
							type="number"
							value={form.precio_venta}
							onChange={(e) => setForm({ ...form, precio_venta: Number(e.target.value) })}
							required
						/>
					</div>
				</div>

				<div className="border border-border rounded-xl overflow-hidden">
					<Table>
						<TableHeader className="bg-muted/50">
							<TableRow>
								<TableHead className="text-center">Talla</TableHead>
								<TableHead className="text-center">Cantidad Actual</TableHead>
								<TableHead className="text-center w-40">Nueva Cantidad</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{form.detalles.map((det) => (
								<TableRow key={det.talla}>
									<TableCell className="text-center font-bold">{det.talla}</TableCell>
									<TableCell className="text-center">{det.stock}</TableCell>
									<TableCell>
										<Input
											type="number"
											className="text-center"
											value={det.stock}
											onChange={(e) => handleStockChange(det.talla, e.target.value)}
											min="0"
											required
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				<div className="space-y-2">
					<Label htmlFor="observacion">Observación / Motivo del Ajuste</Label>
					<Textarea
						id="observacion"
						placeholder="Escriba aquí el motivo del ajuste..."
						value={form.observacion}
						onChange={(e) => setForm({ ...form, observacion: e.target.value })}
						required
					/>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button type="button" variant="outline" onClick={onClose} disabled={loading}>
						Cancelar
					</Button>
					<Button type="submit" disabled={loading} className="gap-2">
						{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
						Guardar Ajuste
					</Button>
				</div>
			</form>
		</Modal>
	);
};
