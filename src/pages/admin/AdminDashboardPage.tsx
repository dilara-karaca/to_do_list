import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Activity, ShieldCheck, Users, UserCheck, UserX, ListTodo, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useAdminDashboardData } from '../../hooks/useAdminData';
import { isSupabaseConfigured } from '../../lib/supabase';

const formatLogAction = (action: string) => action.replace(/_/g, ' ');

export function AdminDashboardPage() {
    const { user } = useAuth();
    const { stats, logs, loading, error } = useAdminDashboardData(user?.role === 'admin');

    const cards = [
        { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users },
        { label: 'Aktif Kullanıcı', value: stats.activeUsers, icon: UserCheck },
        { label: 'Doğrulanmış Hesap', value: stats.confirmedUsers, icon: ShieldCheck },
        { label: 'Doğrulanmamış', value: stats.unconfirmedUsers, icon: UserX },
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
                    <h1 className="mt-2 text-3xl font-semibold text-white">Genel Bakış</h1>
                    <p className="mt-2 text-sm text-slate-300">Kullanıcılar, görevler ve sistem aktivitelerini tek ekrandan izle.</p>
                </div>
                <Link to="/admin/users" className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950">
                    Kullanıcıları Yönet
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <h2 className="text-lg font-semibold text-white">Kayıt Trendi</h2>
                    <p className="mt-1 text-sm text-slate-400">Son 7 günde {stats.last7DaySignups} yeni kullanıcı kaydı oluştu.</p>
                    <div className="mt-6 flex h-40 items-end gap-3">
                        {[stats.todaySignups, Math.max(stats.last7DaySignups - stats.todaySignups, 0), stats.last7DaySignups].map((value, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-2">
                                <div
                                    className="w-full rounded-t-2xl bg-gradient-to-t from-rose-500 to-rose-300"
                                    style={{ height: `${Math.max(12, (value / Math.max(stats.last7DaySignups, 1)) * 120)}px` }}
                                />
                                <span className="text-xs text-slate-400">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <h2 className="text-lg font-semibold text-white">Son Aktiviteler</h2>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="text-sm text-slate-400">Yükleniyor...</div>
                        ) : logs.length ? logs.map((log) => (
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
