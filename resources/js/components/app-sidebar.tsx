import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    ArrowLeftRight,
    Award,
    BarChart3,
    Box,
    Building2,
    FileText,
    Home,
    Image as ImageIcon,
    Landmark,
    LogOut,
    MessageSquare,
    Package,
    Receipt,
    RefreshCcw,
    RotateCcw,
    Search,
    Settings,
    ShoppingCart,
    Tag,
    TrendingUp,
    Undo2,
    User,
    Users,
    Video,
    Wallet,
    WarehouseIcon,
} from 'lucide-react';
import AppLogo from './app-logo';

export const NAV_ITEMS: NavItem[] = [
    { title: 'Panel principal', url: '/dashboard', icon: Home, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'principal' },
    { title: 'Mi Cuenta', url: '/mi-cuenta', icon: User, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'principal' },
    { title: 'Videos', url: '/videos', icon: Video, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'principal' },
    { title: 'Referencias', url: '/referencias', icon: Package, roles: ['superadmin', 'admin', 'bodega'], group: 'principal' },
    { title: 'Inventario', url: '/inventario', icon: BarChart3, roles: ['superadmin', 'admin', 'bodega'], group: 'principal' },
    { title: 'Ajuste Inventarios', url: '/inventario/ajustes', icon: RotateCcw, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    {
        title: 'Buscar Referencias',
        url: '/referencias-busqueda',
        icon: Search,
        roles: ['superadmin', 'admin', 'bodega', 'local'],
        group: 'operaciones',
    },
    { title: 'Compras', url: '/compras', icon: ShoppingCart, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Ventas', url: '/ventas', icon: Receipt, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'operaciones' },
    { title: 'Mis Facturas', url: '/reporte-facturas', icon: FileText, roles: ['local'], group: 'reportes' },
    { title: 'Facturas', url: '/facturas', icon: FileText, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    { title: 'Traslados', url: '/traslados', icon: ArrowLeftRight, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Cajas', url: '/cajas', icon: Box, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Muestras', url: '/muestras', icon: Archive, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'Cambios', url: '/cambios', icon: RefreshCcw, roles: ['superadmin', 'admin', 'bodega'], group: 'operaciones' },
    { title: 'WhatsApp', url: '/whatsapp', icon: MessageSquare, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'operaciones' },
    { title: 'Devoluciones', url: '/devoluciones', icon: Undo2, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    { title: 'Cardex', url: '/cardex', icon: TrendingUp, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    { title: 'Ventas', url: '/reporte-ventas', icon: BarChart3, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    // { title: 'Ventas Generales', url: '/ventas-generales', icon: BarChart2, roles: ['superadmin', 'admin'], group: 'reportes' },
    { title: 'Cartera', url: '/cartera', icon: Wallet, roles: ['superadmin', 'admin', 'bodega'], group: 'reportes' },
    { title: 'Suscripciones', url: '/reporte-suscripciones', icon: BarChart3, roles: ['superadmin'], group: 'reportes' },
    { title: 'Cuentas', url: '/cuentas', icon: Landmark, roles: ['superadmin'], group: 'admin' },
    { title: 'Importar Datos', url: '/importar', icon: Archive, roles: ['superadmin'], group: 'admin' },
    { title: 'Fotos Masivas', url: '/referencias-bulk-photos', icon: ImageIcon, roles: ['superadmin'], group: 'admin' },
    { title: 'Categorías', url: '/categorias', icon: Tag, roles: ['superadmin', 'admin'], group: 'admin' },
    { title: 'Marcas', url: '/marcas', icon: Award, roles: ['superadmin', 'admin', 'bodega'], group: 'admin' },
    { title: 'Bodegas', url: '/bodegas', icon: WarehouseIcon, roles: ['superadmin', 'admin', 'bodega'], group: 'admin' },
    { title: 'Proveedores', url: '/proveedores', icon: Building2, roles: ['superadmin', 'admin', 'bodega'], group: 'admin' },
    { title: 'Usuarios', url: '/usuarios', icon: Users, roles: ['superadmin', 'admin'], group: 'admin' },
    { title: 'Anuncios', url: '/anuncios', icon: MessageSquare, roles: ['superadmin', 'admin'], group: 'admin' },
    { title: 'Opciones', url: '/opciones', icon: Settings, roles: ['superadmin', 'admin'], group: 'admin' },
    { title: 'Cerrar sesión', url: route('logout'), icon: LogOut, roles: ['superadmin', 'admin', 'bodega', 'local'], group: 'principal', method: 'post' },
];

export const GROUP_META = {
    principal: { label: 'Principal', color: 'text-primary', bg: 'bg-primary/10' },
    operaciones: { label: 'Operaciones', color: 'text-chart-2', bg: 'bg-chart-2/10' },
    reportes: { label: 'Reportes', color: 'text-chart-4', bg: 'bg-chart-4/10' },
    admin: { label: 'Administración', color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const visibleItems = NAV_ITEMS.filter((item) => auth.user && item.roles.includes(auth.user.role));

    // Grouping logic
    const groups = ['principal', 'operaciones', 'reportes', 'admin'] as const;
    const groupedItems = groups
        .map((group) => ({
            group,
            label: GROUP_META[group].label,
            items: visibleItems.filter((item) => item.group === group),
        }))
        .filter((g) => g.items.length > 0);

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
                <NavMain groupedItems={groupedItems} />
            </SidebarContent>
        </Sidebar>
    );
}
