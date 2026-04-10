import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Plus, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddDetailModal } from './AddDetailModal';
import { CreateModal } from './CreateModal';

// Sub-components
import { InvoiceDetailHeader } from './InvoiceDetailHeader';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceList } from './InvoiceList';

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Panel principal', href: route('dashboard') },
	{ title: 'Ventas', href: route('ventas.index') },
];

export default function Index({ filters, lista, cuentas, referencias, bodegas, bodega_accesos, locals, next_id }: any) {
	const { data: facturas } = lista;
	const [selectedFactura, setSelectedFactura] = useState<any>(null);
	const { auth } = usePage().props as any;
	const isAdmin = ['admin', 'bodega', 'superadmin'].includes(auth.user.role);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedRef, setSelectedRef] = useState<any>(null);
	const [selectedDetailIds, setSelectedDetailIds] = useState<number[]>([]);

	useEffect(() => {
		if (facturas.length > 0 && filters.search && !selectedFactura) {
			const found = facturas.find((f: any) => f.id == filters.search);
			if (found) setSelectedFactura(found);
		}
	}, [facturas, filters.search]);

	const handleSearch = (value: string) => {
		router.visit(route('ventas.index', { search: value }), { preserveScroll: true });
	};

	const handleDeleteDetail = async (detalleId: number) => {
		const result = await confirmDialog({
			title: '¿Estás seguro?',
			text: '¿Estás seguro de eliminar este producto? El stock será devuelto a la estantería.',
			icon: 'warning'
		});

		if (!result.isConfirmed) return;

		try {
			const response = await axios.delete(route('api.ventas.detalles.delete', { venta: selectedFactura.id, detalle: detalleId }));
			setSelectedFactura({ ...selectedFactura, detalles: response.data.data });
			showAlert('success', 'Producto eliminado y stock restaurado.');
		} catch (error: any) {
			showAlert('error', error.response?.data?.error || 'Error al eliminar el detalle.');
		}
	};

	const handleUpdatePrice = async (detalle: any) => {
		const confirmed = await confirmDialog({
			title: 'Ajustar Precio',
			input: 'number',
			//@ts-ignore
			inputLabel: 'Nuevo precio unitario',
			inputValue: detalle.precio_unitario,
			confirmButtonText: 'Actualizar',
			inputValidator: (value: string) => {
				if (!value || isNaN(parseFloat(value))) return 'Debes ingresar un precio válido';
				return null;
			}
		});

		if (confirmed.isConfirmed && confirmed.value) {
			try {
				const response = await axios.put(route('api.ventas.detalles.update', { venta: selectedFactura.id, detalle: detalle.id }), {
					precio_unitario: parseFloat(confirmed.value)
				});
				setSelectedFactura({ ...selectedFactura, detalles: response.data.data });
				showAlert('success', 'Precio actualizado correctamente');
			} catch (error: any) {
				showAlert('error', error.response?.data?.error || 'Error al actualizar precio');
			}
		}
	};

	const handleBulkDelete = async () => {
		if (selectedDetailIds.length === 0) return;

		const confirmed = await confirmDialog({
			title: '¿Eliminar seleccionados?',
			text: `Se eliminarán ${selectedDetailIds.length} productos y el stock regresará a la estantería.`,
			icon: 'warning'
		});

		if (confirmed.isConfirmed) {
			try {
				const response = await axios.delete(route('api.ventas.detalles.bulk_delete', { venta: selectedFactura.id }), {
					data: { ids: selectedDetailIds }
				});
				setSelectedFactura({ ...selectedFactura, detalles: response.data.data });
				setSelectedDetailIds([]);
				showAlert('success', 'Productos eliminados correctamente');
			} catch (error: any) {
				showAlert('error', error.response?.data?.error || 'Error al eliminar productos');
			}
		}
	};

	const handleCloseFactura = async () => {
		const result = await confirmDialog({
			title: '¿Cerrar factura?',
			text: '¿Estás seguro de cerrar esta factura? Ya no podrás agregar o quitar productos.',
			icon: 'question'
		});

		if (!result.isConfirmed) return;

		try {
			await axios.post(route('api.ventas.cerrar', { venta: selectedFactura.id }));
			setSelectedFactura({ ...selectedFactura, estado: 'cerrada' });
			showAlert('success', 'Factura cerrada correctamente.');
			router.reload({ only: ['lista'] });
		} catch (error: any) {
			showAlert('error', error.response?.data?.error || 'No se pudo cerrar la factura.');
		}
	};

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Ventas" />

			<div className="p-4 space-y-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<PageHeader
						title="Módulo de Ventas"
						description="Gestión de facturación a locales y control de salidas de inventario."
					/>
					<div className="flex items-center gap-4">
						<Button onClick={() => setIsCreateModalOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Nueva Factura
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					<InvoiceList
						invoices={facturas}
						selectedFactura={selectedFactura}
						onSelectInvoice={setSelectedFactura}
						filters={filters}
						onSearch={handleSearch}
					/>

					<div className="lg:col-span-3 space-y-6">
						{selectedFactura ? (
							<>
								<InvoiceDetailHeader
									factura={selectedFactura}
									isAdmin={isAdmin}
									selectedDetailIds={selectedDetailIds}
									onBulkDelete={handleBulkDelete}
									onAddProduct={() => {
										setSelectedRef(null);
										setDetailModalOpen(true);
									}}
									onCloseFactura={handleCloseFactura}
								/>

								<InvoiceItemsTable
									factura={selectedFactura}
									isAdmin={isAdmin}
									bodegas={bodegas}
									selectedDetailIds={selectedDetailIds}
									onToggleSelectAll={() => {
										if (selectedDetailIds.length === selectedFactura.detalles?.length) {
											setSelectedDetailIds([]);
										} else {
											setSelectedDetailIds(selectedFactura.detalles?.map((d: any) => d.id) || []);
										}
									}}
									onToggleSelectDetail={(id) => {
										setSelectedDetailIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
									}}
									onUpdatePrice={handleUpdatePrice}
									onDeleteDetail={handleDeleteDetail}
								/>
							</>
						) : (
							<Card className="h-[calc(100vh-22rem)] border-2 border-slate-100 border-dashed shadow-none flex items-center justify-center bg-slate-50/50 rounded-3xl">
								<div className="text-center max-w-sm mx-auto space-y-4">
									<div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-slate-200/50 rotate-3">
										<ShoppingCart className="w-10 h-10 text-slate-200" />
									</div>
									<div>
										<p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Comienza ahora</p>
										<p className="text-lg font-bold text-slate-900 leading-tight">Selecciona una factura de la lista para ver sus detalles o crear una nueva.</p>
									</div>
								</div>
							</Card>
						)}
					</div>
				</div>
			</div>

			<CreateModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				accounts={cuentas}
				locals={locals}
				nextId={next_id}
			/>

			<AddDetailModal
				isOpen={detailModalOpen}
				onClose={() => setDetailModalOpen(false)}
				referencia={selectedRef}
				referencias={referencias}
				factura={selectedFactura}
				bodegas={bodegas}
				bodega_accesos={bodega_accesos}
				onAdded={(updatedDetalles: any) => {
					setSelectedFactura({ ...selectedFactura, detalles: updatedDetalles });
					router.reload({ only: ['referencias', 'lista'] });
				}}
			/>
		</AppLayout>
	);
}
