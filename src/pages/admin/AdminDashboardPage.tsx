import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Activity, ListTodo, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminUi } from '../../components/admin/adminUi';
import { useAuth } from '../../auth/AuthProvider';
import { useAdminDashboardData } from '../../hooks/useAdminData';
import { getRecentSignIns } from '../../lib/adminService';
import { isSupabaseConfigured } from '../../lib/supabase';

const formatLogAction = (action: string) => action.replace(/_/g, ' ');

const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
        return '—';
    }

    return format(parseISO(value), 'd MMM yyyy HH:mm', { locale: tr });
};

export function AdminDashboardPage() {
    const { user } = useAuth();
    const { stats, users, logs, loading, error } = useAdminDashboardData(user?.role === 'admin');
    const recentSignIns = getRecentSignIns(users, 8);

    const cards = [
        { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users },
        { label: 'Aktif Kullanıcı', value: stats.activeUsers, icon: UserCheck },
        { label: 'KVKK Onaylı', value: stats.kvkkApprovedUsers, icon: ShieldCheck },
        { label: 'Toplam Görev', value: stats.totalTasks, icon: ListTodo },
        { label: 'Bugünkü Kayıt', value: stats.todaySignups, icon: UserPlus },
        { label: 'Son 7 Gün Kayıt', value: stats.last7DaySignups, icon: Activity },
    ];

    return (
        <div className={adminUi.page}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className={adminUi.subtitle}>Admin Dashboard</div>
                    <h1 className={`mt-2 ${adminUi.title}`}>Kullanıcı Yönetimi</h1>
                    <p className={`mt-2 ${adminUi.muted}`}>Kullanıcıları, son girişleri ve planner verilerini buradan yönet.</p>
                </div>
                <Link to="/admin/users" className={adminUi.button}>
                    Tüm Kullanıcılar
                </Link>
            </div>

            {!isSupabaseConfigured ? (
                <div className={adminUi.warning}>Supabase bağlı değil. Admin paneli demo verilerle sınırlı çalışır.</div>
            ) : null}

            {error ? <div className={adminUi.error}>{error}</div> : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className={adminUi.card}>
                        <div className="flex items-center justify-between gap-3">
                            <div className={adminUi.label}>{label}</div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950/5 text-slate-700">
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div className={`mt-3 ${adminUi.value}`}>{loading ? '...' : value}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className={adminUi.card}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className={adminUi.sectionTitle}>Son Girişler</h2>
                            <p className={`mt-1 ${adminUi.muted}`}>En son oturum açan kullanıcılar</p>
                        </div>
                        <Link to="/admin/users" className={adminUi.link}>Tümünü gör</Link>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className={`${adminUi.table} min-w-[640px]`}>
                            <thead className={adminUi.tableHead}>
                                <tr>
                                    <th className="pb-3 pr-4">Kullanıcı</th>
                                    <th className="pb-3 pr-4">Son Giriş</th>
                                    <th className="pb-3 pr-4">Görev</th>
                                    <th className="pb-3">Detay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="py-6 text-slate-500">Yükleniyor...</td></tr>
                                ) : recentSignIns.map((candidate) => (
                                    <tr key={candidate.id} className="border-t border-slate-100">
                                        <td className="py-3 pr-4">
                                            <div className="font-medium text-slate-900">{candidate.fullName}</div>
                                            <div className="text-xs text-slate-500">{candidate.email}</div>
                                        </td>
                                        <td className="py-3 pr-4">{formatDateTime(candidate.lastSignInAt)}</td>
                                        <td className="py-3 pr-4">{candidate.taskCount}</td>
                                        <td className="py-3">
                                            <Link to={`/admin/users/${candidate.id}`} className={adminUi.chip}>
                                                Görüntüle
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={adminUi.card}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className={adminUi.sectionTitle}>Son Aktiviteler</h2>
                        <Link to="/admin/activity" className={adminUi.link}>Tümü</Link>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="text-sm text-slate-500">Yükleniyor...</div>
                        ) : logs.length ? logs.slice(0, 6).map((log) => (
                            <div key={log.id} className={adminUi.cardSoft}>
                                <div className="text-sm font-medium capitalize text-slate-900">{formatLogAction(log.action)}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {format(parseISO(log.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-slate-500">Henüz aktivite kaydı yok.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
