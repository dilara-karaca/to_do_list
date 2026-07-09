import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Activity, ListTodo, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-rose-300">Admin Dashboard</div>
                    <h1 className="mt-2 text-3xl font-semibold text-white">Kullanıcı Yönetimi</h1>
                    <p className="mt-2 text-sm text-slate-300">Kullanıcıları, son girişleri ve planner verilerini buradan yönet.</p>
                </div>
                <Link to="/admin/users" className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950">
                    Tüm Kullanıcılar
                </Link>
            </div>

            {!isSupabaseConfigured ? (
                <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Supabase bağlı değil. Admin paneli demo verilerle sınırlı çalışır.
                </div>
            ) : null}

            {error ? (
                <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm text-slate-300">{label}</div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-rose-200">
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-3xl font-semibold text-white">{loading ? '...' : value}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Son Girişler</h2>
                            <p className="mt-1 text-sm text-slate-400">En son oturum açan kullanıcılar</p>
                        </div>
                        <Link to="/admin/users" className="text-sm text-rose-200 hover:text-white">Tümünü gör</Link>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="text-slate-400">
                                <tr>
                                    <th className="pb-3 pr-4">Kullanıcı</th>
                                    <th className="pb-3 pr-4">Son Giriş</th>
                                    <th className="pb-3 pr-4">Görev</th>
                                    <th className="pb-3">Detay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="py-6 text-slate-400">Yükleniyor...</td></tr>
                                ) : recentSignIns.map((candidate) => (
                                    <tr key={candidate.id} className="border-t border-white/10">
                                        <td className="py-3 pr-4">
                                            <div className="font-medium text-white">{candidate.fullName}</div>
                                            <div className="text-xs text-slate-400">{candidate.email}</div>
                                        </td>
                                        <td className="py-3 pr-4 text-slate-300">{formatDateTime(candidate.lastSignInAt)}</td>
                                        <td className="py-3 pr-4 text-slate-300">{candidate.taskCount}</td>
                                        <td className="py-3">
                                            <Link to={`/admin/users/${candidate.id}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15">
                                                Görüntüle
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-white">Son Aktiviteler</h2>
                        <Link to="/admin/activity" className="text-sm text-rose-200 hover:text-white">Tümü</Link>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="text-sm text-slate-400">Yükleniyor...</div>
                        ) : logs.length ? logs.slice(0, 6).map((log) => (
                            <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <div className="text-sm font-medium capitalize text-white">{formatLogAction(log.action)}</div>
                                <div className="mt-1 text-xs text-slate-400">
                                    {format(parseISO(log.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-slate-400">Henüz aktivite kaydı yok.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
