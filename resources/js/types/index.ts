import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles: string[];
    group: string;
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_superadmin: boolean;
    is_admin: boolean;
    is_bodega: boolean;
    is_local: boolean;
    cuenta_id: number | null;
    impresion_principal: boolean;
    nombre_impresora?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

declare global {
    interface Window {
        axios: typeof import('axios').default;
    }
}
