import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../types/auth';
import { useAuth } from './AuthProvider';

type RoleRouteProps = {
    allowedRoles: UserRole[];
    unauthorizedElement: ReactNode;
};

export function RoleRoute({ allowedRoles, unauthorizedElement }: RoleRouteProps) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <>{unauthorizedElement}</>;
    }

    return <Outlet />;
}
