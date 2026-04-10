import { usePage } from '@inertiajs/react';
import { SharedData, User } from '@/types';

export const useAuth = () => {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user as User;

    return {
        user,
        isSuperAdmin: user?.role === 'superadmin',
        isAdmin: user?.role === 'admin',
        isBodega: user?.role === 'bodega',
        isLocal: user?.role === 'local',
        role: user?.role || 'sin-rol',
    };
};
