import { usePage } from '@inertiajs/react';
import { SharedData, User } from '@/types';

export const useAuth = () => {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user as User;

    return {
        user,
        isSuperAdmin: user?.is_superadmin || false,
        isAdmin: user?.is_admin || false,
        isBodega: user?.is_bodega || false,
        isLocal: user?.is_local || false,
        role: user?.role || 'sin-rol',
    };
};
