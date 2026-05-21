import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/form/InputField';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import axios from 'axios';
import { Edit, LayoutGrid, Plus, Trash } from 'lucide-react';
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
        estado: true,
    });

    const fetchShelves = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('bodegas.estanterias.index', { bodega: bodega.id }));
            const sorted = (response.data.data || []).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true, sensitivity: 'base' }));
            setShelves(sorted);
        } catch (error) {
            console.error('Error fetching shelves:', error);
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
            estado: !!shelf.estado,
        });
    };

    const handleDelete = async (id: number) => {
        const result = await confirmDialog({
            title: '¿Estás seguro?',
            text: '¿Estás seguro de eliminar esta estantería?',
            icon: 'warning',
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
        <Modal show={isOpen} closeable={true} onClose={onClose} title={`Estanterías: ${bodega.nombre}`} maxWidth="2xl">
            <div className="bg-background space-y-8 p-6">
                {/* Form Section */}
                <form onSubmit={handleSubmit} className="bg-muted/30 border-border space-y-4 rounded-md border p-4">
                    <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
                        {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingId ? 'Editar Estantería' : 'Nueva Estantería'}
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                className="border-border bg-background text-primary focus:ring-ring rounded"
                            />
                            <label htmlFor="shelf-status" className="text-muted-foreground cursor-pointer text-sm font-medium">
                                Activa
                            </label>
                        </div>
                        <div className="flex gap-2">
                            {editingId && (
                                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                                    Cancelar
                                </Button>
                            )}
                            <Button loading={processing} size="sm">
                                {editingId ? 'Actualizar' : 'Crear Estantería'}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* List Section */}
                <div className="space-y-4">
                    <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
                        <LayoutGrid className="h-4 w-4" />
                        Estanterías Existentes
                    </h4>

                    {loading ? (
                        <div className="text-muted-foreground animate-pulse py-12 text-center">Cargando estanterías...</div>
                    ) : shelves.length === 0 ? (
                        <div className="text-muted-foreground bg-muted/30 border-border rounded-md border border-dashed py-12 text-center">
                            No hay estanterías creadas en esta bodega.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {shelves.map((shelf) => (
                                <div
                                    key={shelf.id}
                                    className="bg-background border-border group flex items-center justify-between rounded-md border p-4 transition-all hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground font-bold">{shelf.nombre}</span>
                                                <Badge variant={shelf.estado ? 'default' : 'destructive'} className="h-4 text-[10px]">
                                                    {shelf.estado ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-xs">{shelf.descripcion || 'Sin descripción'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            onClick={() => handleEdit(shelf)}
                                            className="text-muted-foreground hover:text-primary hover:bg-muted rounded-lg p-2 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(shelf.id)}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
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

            <div className="bg-muted/30 border-t p-4 text-right">
                <Button variant="outline" onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </Modal>
    );
};
