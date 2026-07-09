import { useAuth } from '../../auth/AuthProvider';
import { adminUi } from '../../components/admin/adminUi';
import { useAdminDashboardData } from '../../hooks/useAdminData';

export function AdminStatsPage() {
    const { user } = useAuth();
    const { stats, loading } = useAdminDashboardData(user?.role === 'admin');

    const rows = [
        { label: 'Toplam kullanıcı', value: stats.totalUsers },
        { label: 'Aktif kullanıcı', value: stats.activeUsers },
        { label: 'Pasif kullanıcı', value: stats.totalUsers - stats.activeUsers },
        { label: 'Doğrulanmış e-posta', value: stats.confirmedUsers },
        { label: 'KVKK onaylı kullanıcı', value: stats.kvkkApprovedUsers },
        { label: 'Toplam görev', value: stats.totalTasks },
        { label: 'Bugünkü kayıt', value: stats.todaySignups },
        { label: 'Son 7 gün kayıt', value: stats.last7DaySignups },
    ];

    return (
        <div className={adminUi.page}>
            <div>
                <div className={adminUi.subtitle}>İstatistikler</div>
                <h1 className={`mt-2 ${adminUi.title}`}>Sistem Özeti</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {rows.map((row) => (
                    <div key={row.label} className={adminUi.card}>
                        <div className={adminUi.label}>{row.label}</div>
                        <div className={`mt-3 ${adminUi.value}`}>{loading ? '...' : row.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
