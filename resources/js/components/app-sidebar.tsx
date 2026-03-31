import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Archive, ArrowLeftRight, BarChart2, BarChart3, Box, Building2, FileText, Home, Landmark, Package, Receipt, RefreshCcw, Settings, ShoppingCart, Tag, TrendingUp, Undo2, Users, Wallet, WarehouseIcon } from 'lucide-react';
import AppLogo from './app-logo';


export const NAV_ITEMS: NavItem[] = [
    { title: 'Panel principal', url: '/dashboard', icon: Home, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'principal' },
    { title: 'Cuentas', url: '/cuentas', icon: Landmark, roles: ['superadmin'], group: 'principal' },
    { title: 'Referencias', url: '/referencias', icon: Package, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'principal' },
    { title: 'Inventario', url: '/inventario', icon: BarChart3, roles: ['superadmin', 'admin', 'bodega'], group: 'principal' },
    { title: 'Compras', url: '/compras', icon: ShoppingCart, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Ventas', url: '/ventas', icon: Receipt, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'operaciones' },
    { title: 'Mis Facturas', url: '/reporte-facturas', icon: FileText, roles: ['local'], group: 'reportes' },
    { title: 'Facturas', url: '/facturas', icon: FileText, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Traslados', url: '/traslados', icon: ArrowLeftRight, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Cajas', url: '/cajas', icon: Box, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Muestras', url: '/muestras', icon: Archive, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Cambios', url: '/cambios', icon: RefreshCcw, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Devoluciones', url: '/devoluciones', icon: Undo2, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Cardex', url: '/cardex', icon: TrendingUp, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    { title: 'Ventas Generales', url: '/ventas-generales', icon: BarChart2, roles: ['superadmin', 'admin'], group: 'reportes' },
    { title: 'Cartera', url: '/cartera', icon: Wallet, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    { title: 'Bodegas', url: '/bodegas', icon: WarehouseIcon, roles: ['superadmin', 'admin', 'bodega'], group: 'admin' },
    { title: 'Categorías', url: '/categorias', icon: Tag, roles: ['superadmin', 'admin'], group: 'admin' },
    { title: 'Proveedores', url: '/proveedores', icon: Building2, roles: ['superadmin', 'admin', 'bodega'], group: 'admin' },
    { title: 'Usuarios', url: '/usuarios', icon: Users, roles: ['superadmin', 'admin'], group: 'admin' },
    { title: 'Opciones', url: '/opciones', icon: Settings, roles: ['superadmin', 'admin'], group: 'admin' },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const visibleItems = NAV_ITEMS.filter(item => auth.user && item.roles.includes(auth.user.role));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleItems} />
            </SidebarContent>
        </Sidebar>
    );
}
