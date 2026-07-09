import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Clock3, Mail, Shield, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { AdminUserPlannerPanel } from '../../components/admin/AdminUserPlannerPanel';
import { useAdminUserDetail } from '../../hooks/useAdminData';

const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
        return '—';
    }

    return format(parseISO(value), 'd MMM yyyy HH:mm', { locale: tr });
};

export function AdminUserDetailPage() {
    const { userId } = useParams();
    const { user: currentUser, users: fallbackUsers, updateRole, setActive, setEmailConfirmed } = useAuth();
    const { user, taskMap, loading, error, refresh } = useAdminUserDetail(userId, currentUser?.role === 'admin', fallbackUsers);

    if (!userId) {
        return <div className="text-white">Kullanıcı seçilmedi.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Kullanıcı listesine dön
                    </Link>
                    <div className="mt-4 text-xs uppercase tracking-[0.24em] text-rose-300">Kullanıcı Detayı</div>
                    <h1 className="mt-2 text-3xl font-semibold text-white">{user?.fullName ?? 'Kullanıcı'}</h1>
                    <p className="mt-1 text-sm text-slate-400">{user?.email ?? userId}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void refresh()} className="h-11 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white">
                        Yenile
                    </button>
                    {user ? (
                        <>
                            <button type="button" onClick={() => setEmailConfirmed(user.id, !user.emailConfirmed)} className="h-11 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white">
                                {user.emailConfirmed ? 'Maili Beklet' : 'Maili Onayla'}
                            </button>
                            <button type="button" onClick={() => setActive(user.id, !user.active)} className="h-11 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white">
                                {user.active ? 'Pasifleştir' : 'Aktifleştir'}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            {loading && !user ? (
                <div className="text-slate-400">Kullanıcı detayı yükleniyor...</div>
            ) : user ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-400"><UserRound className="h-4 w-4" /> Rol</div>
                            <select
                                value={user.role}
                                onChange={(event) => updateRole(user.id, event.target.value as 'user' | 'admin')}
                                className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2 text-white"
                            >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>
                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-400"><Clock3 className="h-4 w-4" /> Son Giriş</div>
                            <div className="mt-3 text-lg font-semibold text-white">{formatDateTime(user.lastSignInAt)}</div>
                        </div>
                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-400"><CalendarDays className="h-4 w-4" /> Kayıt Tarihi</div>
                            <div className="mt-3 text-lg font-semibold text-white">{formatDateTime(user.createdAt)}</div>
                        </div>
                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-400"><Shield className="h-4 w-4" /> Durum</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs ${user.active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                                    {user.active ? 'Aktif' : 'Pasif'}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs ${user.emailConfirmed ? 'bg-sky-500/15 text-sky-200' : 'bg-amber-500/15 text-amber-100'}`}>
                                    {user.emailConfirmed ? 'Mail doğrulandı' : 'Mail bekliyor'}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs ${user.kvkkConsent ? 'bg-violet-500/15 text-violet-200' : 'bg-slate-500/15 text-slate-300'}`}>
                                    {user.kvkkConsent ? 'KVKK onaylı' : 'KVKK yok'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                            <h2 className="text-lg font-semibold text-white">Hesap Bilgileri</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                                    <dt className="text-slate-400">E-posta</dt>
                                    <dd className="text-right text-white">{user.email}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                                    <dt className="text-slate-400">KVKK Onay Tarihi</dt>
                                    <dd className="text-right text-white">{formatDateTime(user.kvkkConsentAt)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                                    <dt className="text-slate-400">Son Güncelleme</dt>
                                    <dd className="text-right text-white">{formatDateTime(user.updatedAt)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-400">Son Görev Günü</dt>
                                    <dd className="text-right text-white">
                                        {user.lastTaskDate ? format(parseISO(user.lastTaskDate), 'd MMM yyyy', { locale: tr }) : '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                            <h2 className="text-lg font-semibold text-white">Planner Özeti</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Toplam Görev</div>
                                    <div className="mt-2 text-2xl font-semibold text-white">{user.taskCount}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tamamlanan</div>
                                    <div className="mt-2 text-2xl font-semibold text-white">{user.completedTaskCount}</div>
                                </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-400">
                                Bu bölümde kullanıcının planner verilerini salt okunur olarak görüntüleyebilirsin. Değişiklik yapılamaz.
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-semibold text-white">Planner Görünümü</h2>
                            <p className="mt-1 text-sm text-slate-400">Kullanıcının günlük görev planı</p>
                        </div>
                        <AdminUserPlannerPanel
                            taskMap={taskMap}
                            loading={loading}
                            readOnlyLabel="Bu ekran salt okunurdur. Kullanıcının planner verilerini admin olarak görüntülüyorsun."
                        />
                    </section>
                </>
            ) : (
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-8 text-center text-slate-400">
                    Kullanıcı bulunamadı.
                </div>
            )}
        </div>
    );
}
