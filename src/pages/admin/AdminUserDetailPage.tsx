import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Clock3, Mail, Shield, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { adminUi } from '../../components/admin/adminUi';
import { AdminUserPlannerPanel } from '../../components/admin/AdminUserPlannerPanel';
import { useAdminUserDetail } from '../../hooks/useAdminData';

const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    return format(parseISO(value), 'd MMM yyyy HH:mm', { locale: tr });
};

export function AdminUserDetailPage() {
    const { userId } = useParams();
    const { user: currentUser, users: fallbackUsers, updateRole, setActive, setEmailConfirmed } = useAuth();
    const { user, taskMap, loading, error, refresh } = useAdminUserDetail(userId, currentUser?.role === 'admin', fallbackUsers);

    if (!userId) {
        return <div className="text-slate-700">Kullanıcı seçilmedi.</div>;
    }

    return (
        <div className={adminUi.page}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Link to="/admin/users" className={`inline-flex items-center gap-2 ${adminUi.link}`}>
                        <ArrowLeft className="h-4 w-4" />
                        Kullanıcı listesine dön
                    </Link>
                    <div className={`mt-4 ${adminUi.subtitle}`}>Kullanıcı Detayı</div>
                    <h1 className={`mt-2 ${adminUi.title}`}>{user?.fullName ?? 'Kullanıcı'}</h1>
                    <p className={`mt-1 ${adminUi.muted}`}>{user?.email ?? userId}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void refresh()} className={adminUi.buttonSecondary}>Yenile</button>
                    {user ? (
                        <>
                            <button type="button" onClick={() => setEmailConfirmed(user.id, !user.emailConfirmed)} className={adminUi.buttonSecondary}>
                                {user.emailConfirmed ? 'Maili Beklet' : 'Maili Onayla'}
                            </button>
                            <button type="button" onClick={() => setActive(user.id, !user.active)} className={adminUi.buttonSecondary}>
                                {user.active ? 'Pasifleştir' : 'Aktifleştir'}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {error ? <div className={adminUi.error}>{error}</div> : null}

            {loading && !user ? (
                <div className="text-slate-500">Kullanıcı detayı yükleniyor...</div>
            ) : user ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className={adminUi.card}>
                            <div className={`flex items-center gap-2 ${adminUi.label}`}><UserRound className="h-4 w-4" /> Rol</div>
                            <select value={user.role} onChange={(event) => updateRole(user.id, event.target.value as 'user' | 'admin')} className="mt-3 w-full rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-slate-800">
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>
                        <div className={adminUi.card}>
                            <div className={`flex items-center gap-2 ${adminUi.label}`}><Clock3 className="h-4 w-4" /> Son Giriş</div>
                            <div className="mt-3 text-lg font-semibold text-slate-900">{formatDateTime(user.lastSignInAt)}</div>
                        </div>
                        <div className={adminUi.card}>
                            <div className={`flex items-center gap-2 ${adminUi.label}`}><CalendarDays className="h-4 w-4" /> Kayıt Tarihi</div>
                            <div className="mt-3 text-lg font-semibold text-slate-900">{formatDateTime(user.createdAt)}</div>
                        </div>
                        <div className={adminUi.card}>
                            <div className={`flex items-center gap-2 ${adminUi.label}`}><Shield className="h-4 w-4" /> Durum</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={user.active ? adminUi.badgeActive : adminUi.badgeInactive}>{user.active ? 'Aktif' : 'Pasif'}</span>
                                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">{user.emailConfirmed ? 'Mail doğrulandı' : 'Mail bekliyor'}</span>
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">{user.kvkkConsent ? 'KVKK onaylı' : 'KVKK yok'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className={adminUi.card}>
                            <h2 className={adminUi.sectionTitle}>Hesap Bilgileri</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">E-posta</dt>
                                    <dd className="text-right text-slate-900">{user.email}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">KVKK Onay Tarihi</dt>
                                    <dd className="text-right text-slate-900">{formatDateTime(user.kvkkConsentAt)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">Son Güncelleme</dt>
                                    <dd className="text-right text-slate-900">{formatDateTime(user.updatedAt)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Son Görev Günü</dt>
                                    <dd className="text-right text-slate-900">
                                        {user.lastTaskDate ? format(parseISO(user.lastTaskDate), 'd MMM yyyy', { locale: tr }) : '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className={adminUi.card}>
                            <h2 className={adminUi.sectionTitle}>Planner Özeti</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className={adminUi.cardSoft}>
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Toplam Görev</div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-900">{user.taskCount}</div>
                                </div>
                                <div className={adminUi.cardSoft}>
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Tamamlanan</div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-900">{user.completedTaskCount}</div>
                                </div>
                            </div>
                            <p className={`mt-4 ${adminUi.muted}`}>
                                Bu bölümde kullanıcının planner verilerini salt okunur olarak görüntüleyebilirsin.
                            </p>
                            <div className={`mt-4 inline-flex items-center gap-2 ${adminUi.muted}`}>
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <div>
                            <h2 className={adminUi.title}>Planner Görünümü</h2>
                            <p className={`mt-1 ${adminUi.muted}`}>Kullanıcının günlük görev planı</p>
                        </div>
                        <AdminUserPlannerPanel
                            taskMap={taskMap}
                            loading={loading}
                            readOnlyLabel="Bu ekran salt okunurdur. Kullanıcının planner verilerini admin olarak görüntülüyorsun."
                        />
                    </section>
                </>
            ) : (
                <div className={`${adminUi.card} text-center text-slate-500`}>Kullanıcı bulunamadı.</div>
            )}
        </div>
    );
}
