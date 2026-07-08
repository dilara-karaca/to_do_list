import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function ProtectedRoute() {
    const { authenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="grid min-h-screen place-items-center text-slate-500">Yükleniyor...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
