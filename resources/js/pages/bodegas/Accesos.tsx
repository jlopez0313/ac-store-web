import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Check, Search as SearchIcon, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { AccesoModal } from './AccesoModal';
import axios from 'axios';

export default function Accesos({ bodega }: any) {
	const { isSuperAdmin } = useAuth();
	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Panel principal', href: route('dashboard') },
		{ title: 'Bodegas', href: route('bodegas.index') },
		{ title: `Accesos: ${bodega.nombre}`, href: route('bodegas.accesos', { bodega: bodega.id }) },
	];

	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedLocal, setSelectedLocal] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [search, setSearch] = useState('');

	const fetchData = useCallback(async (v = '') => {
		setLoading(true);
		try {
			const response = await axios.get(route('api.bodegas.accesos', { bodega: bodega.id }), {
				params: { search: v }
			});
			setItems(response.data.data);
		} catch (error) {
			console.error('Error fetching accesos:', error);
		} finally {
			setLoading(false);
		}
	}, [bodega.id]);

	useEffect(() => {
		fetchData();
	}, []);

	const openModal = (local: any) => {
		setSelectedLocal(local);
		setIsModalOpen(true);
	};

	const handleSearch = (v: string) => {
		setSearch(v);
		fetchData(v);
	};

	const columns = [
		{
			name: 'Usuario Local',
			cell: (row: any) => (
				<div className="flex flex-col py-2">
					<span className="font-bold text-foreground">{row.nombre}</span>
					<span className="text-xs text-muted-foreground italic">{row.username}</span>
				</div>
			),
			sortable: true,
			grow: 1.5,
			noTruncate: true,
		},
		{
			name: 'Email',
			selector: (row: any) => row.email,
			sortable: true,
		},
		{
			name: 'Ver Stock',
			cell: (row: any) => (
				row.can_view ? (
					<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1">
						<Check className="h-3 w-3" /> Permitido
					</Badge>
				) : (
					<Badge variant="outline" className="text-muted-foreground border-border gap-1">
						<X className="h-3 w-3" /> Denegado
					</Badge>
				)
			),
		},
		{
			name: 'Pedir Stock',
			cell: (row: any) => (
				row.can_order ? (
					<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1">
						<Check className="h-3 w-3" /> Permitido
					</Badge>
				) : (
					<Badge variant="outline" className="text-muted-foreground border-border gap-1">
						<X className="h-3 w-3" /> Denegado
					</Badge>
				)
			),
		},
		{
			name: 'Descuento',
			cell: (row: any) => (
				<span className="font-bold text-emerald-600">
					${Number(row.descuento || 0).toLocaleString()}
				</span>
			),
			sortable: true,
		}
	];

	const actions = [
		{
			title: 'Configurar',
			icon: ShieldCheck,
			action: (id: any) => {
				const item = items.find((i: any) => i.id === id);
				if (item) openModal(item);
			}
		}
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title={`Accesos - ${bodega.nombre}`} />

			<div className="p-4 space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.visit(route('bodegas.index'))}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<PageHeader
						title={`Locales con acceso a: ${bodega.nombre}`}
						description="Asigna permisos de visualización y pedido a locales."
					/>
				</div>

				<div className="flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar local por nombre..."
							className="pl-9"
							value={search}
							onChange={(e) => handleSearch(e.target.value)}
						/>
					</div>
				</div>

				<div className="bg-background rounded-xl shadow-xs border border-border overflow-hidden">
					<DataGrid
						data={items}
						columns={columns}
						total={items.length}
						actions={actions}
						processing={loading}
						onSort={() => { }}
						fetchPage={() => { }}
						setPageSize={() => { }}
					/>
				</div>
			</div>

			<AccesoModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				bodega={bodega}
				local={selectedLocal}
				onSuccess={() => fetchData(search)}
			/>
		</AppLayout>
	);
}
