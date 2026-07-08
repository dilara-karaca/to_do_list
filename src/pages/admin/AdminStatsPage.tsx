import { useAuth } from '../../auth/AuthProvider';
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
        <div className="space-y-6">
            <div>
                <div className="text-xs uppercase tracking-[0.3em] text-rose-300">İstatistikler</div>
                <h1 className="mt-2 text-3xl font-semibold text-white">Sistem Özeti</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {rows.map((row) => (
                    <div key={row.label} className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                        <div className="text-sm text-slate-400">{row.label}</div>
                        <div className="mt-3 text-3xl font-semibold text-white">{loading ? '...' : row.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
