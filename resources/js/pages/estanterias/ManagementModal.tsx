import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { Badge } from '@/components/ui/badge';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Plus, Edit, Trash, LayoutGrid, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ManagementModal = ({ isOpen, onClose, bodega }: any) => {
	const [shelves, setShelves] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [processing, setProcessing] = useState(false);

	// Form state for creating/editing
	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState({
		nombre: '',
		descripcion: '',
		estado: true
	});

	const fetchShelves = async () => {
		setLoading(true);
		try {
			const response = await axios.get(route('bodegas.estanterias.index', { bodega: bodega.id }));
			setShelves(response.data.data || []);
		} catch (error) {
			console.error("Error fetching shelves:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen && bodega) {
			fetchShelves();
			resetForm();
		}
	}, [isOpen, bodega]);

	const resetForm = () => {
		setForm({ nombre: '', descripcion: '', estado: true });
		setEditingId(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setProcessing(true);
		try {
			if (editingId) {
				await axios.put(route('bodegas.estanterias.update', { bodega: bodega.id, estanteria: editingId }), form);
				showAlert('success', 'Estantería actualizada correctamente.');
			} else {
				await axios.post(route('bodegas.estanterias.store', { bodega: bodega.id }), form);
				showAlert('success', 'Estantería creada correctamente.');
			}
			fetchShelves();
			resetForm();
		} catch (error: any) {
			const msg = error.response?.data?.error || 'Error al procesar la estantería.';
			showAlert('error', msg);
		} finally {
			setProcessing(false);
		}
	};

	const handleEdit = (shelf: any) => {
		setEditingId(shelf.id);
		setForm({
			nombre: shelf.nombre,
			descripcion: shelf.descripcion || '',
			estado: !!shelf.estado
		});
	};

	const handleDelete = async (id: number) => {
		const result = await confirmDialog({
			title: '¿Estás seguro?',
			text: '¿Estás seguro de eliminar esta estantería?',
			icon: 'warning'
		});

		if (!result.isConfirmed) return;
		
		setProcessing(true);
		try {
			await axios.delete(route('bodegas.estanterias.destroy', { bodega: bodega.id, estanteria: id }));
			showAlert('success', 'Estantería eliminada correctamente.');
			fetchShelves();
		} catch (error: any) {
			const msg = error.response?.data?.error || 'Error al eliminar la estantería.';
			showAlert('error', msg);
		} finally {
			setProcessing(false);
		}
	};

	return (
		<Modal
			show={isOpen}
			closeable={true}
			onClose={onClose}
			title={`Estanterías: ${bodega.nombre}`}
			maxWidth="2xl"
		>
			<div className="p-6 space-y-8 bg-background">
				{/* Form Section */}
				<form onSubmit={handleSubmit} className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
					<h4 className="text-sm font-bold text-foreground flex items-center gap-2">
						{editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
						{editingId ? 'Editar Estantería' : 'Nueva Estantería'}
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							name="nombre"
							title="Nombre / Código"
							placeholder="Ej: Estante A1"
							required
							value={form.nombre}
							onChange={(v) => setForm({ ...form, nombre: v as string })}
						/>
						<InputField
							name="descripcion"
							title="Descripción"
							placeholder="Opcional"
							value={form.descripcion}
							onChange={(v) => setForm({ ...form, descripcion: v as string })}
						/>
					</div>
					<div className="flex items-center justify-between pt-2">
						<div className="flex items-center gap-2">
							<input 
								type="checkbox" 
								id="shelf-status"
								checked={form.estado}
								onChange={(e) => setForm({ ...form, estado: e.target.checked })}
								className="rounded border-border bg-background text-primary focus:ring-ring"
							/>
							<label htmlFor="shelf-status" className="text-sm font-medium text-muted-foreground cursor-pointer">Activa</label>
						</div>
						<div className="flex gap-2">
							{editingId && (
								<Button type="button" variant="outline" size="sm" onClick={resetForm}>
									Cancelar
								</Button>
							)}
							<Button disabled={processing} size="sm">
								{editingId ? 'Actualizar' : 'Crear Estantería'}
							</Button>
						</div>
					</div>
				</form>

				{/* List Section */}
				<div className="space-y-4">
					<h4 className="text-sm font-bold text-foreground flex items-center gap-2">
						<LayoutGrid className="h-4 w-4" />
						Estanterías Existentes
					</h4>
					
					{loading ? (
						<div className="py-12 text-center text-muted-foreground animate-pulse">Cargando estanterías...</div>
					) : shelves.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
							No hay estanterías creadas en esta bodega.
						</div>
					) : (
						<div className="grid grid-cols-1 gap-2">
							{shelves.map((shelf) => (
								<div key={shelf.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:shadow-sm transition-all group">
									<div className="flex items-center gap-4">
										<div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
											<LayoutGrid className="h-5 w-5" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-bold text-foreground">{shelf.nombre}</span>
												<Badge variant={shelf.estado ? 'default' : 'destructive'} className="text-[10px] h-4">
													{shelf.estado ? 'Activa' : 'Inactiva'}
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground">{shelf.descripcion || 'Sin descripción'}</p>
										</div>
									</div>
									<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button 
											onClick={() => handleEdit(shelf)}
											className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
											title="Editar"
										>
											<Edit className="h-4 w-4" />
										</button>
										<button 
											onClick={() => handleDelete(shelf.id)}
											className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
											title="Eliminar"
										>
											<Trash className="h-4 w-4" />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
			
			<div className="p-4 bg-muted/30 border-t text-right">
				<Button variant="outline" onClick={onClose}>Cerrar</Button>
			</div>
		</Modal>
	);
};
