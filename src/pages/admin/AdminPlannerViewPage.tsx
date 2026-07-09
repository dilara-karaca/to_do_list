import { Navigate, useParams } from 'react-router-dom';

export function AdminPlannerViewPage() {
    const { userId } = useParams();

    if (!userId) {
        return <Navigate to="/admin/users" replace />;
    }

    return <Navigate to={`/admin/users/${userId}`} replace />;
}
