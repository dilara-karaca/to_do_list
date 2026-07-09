import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminUi } from '../../components/admin/adminUi';
import { useAuth } from '../../auth/AuthProvider';
import { useAdminUsersData } from '../../hooks/useAdminData';

const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    return format(parseISO(value), 'd MMM yyyy HH:mm', { locale: tr });
};

export function AdminUsersPage() {
    const { user, users: fallbackUsers, updateRole, setActive, setEmailConfirmed } = useAuth();
    const { users, loading, error, refresh } = useAdminUsersData(user?.role === 'admin', fallbackUsers);
    const [query, setQuery] = useState('');

    const filteredUsers = useMemo(
        () => users.filter((candidate) => [candidate.fullName, candidate.email].some((value) => value.toLowerCase().includes(query.toLowerCase()))),
        [query, users],
    );

    return (
        <div className={adminUi.page}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className={adminUi.title}>Kullanıcılar</h1>
                    <p className={`mt-1 ${adminUi.muted}`}>{users.length} kayıtlı kullanıcı</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => void refresh()} className={adminUi.buttonSecondary}>Yenile</button>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad veya e-posta ile ara" className={`${adminUi.input} sm:max-w-sm`} />
                </div>
            </div>

            {error ? <div className={adminUi.error}>{error}</div> : null}

            <div className="overflow-x-auto rounded-[24px] glass-card">
                <table className={`${adminUi.table} min-w-[1100px]`}>
                    <thead className={adminUi.tableHead}>
                        <tr>
                            <th className="px-4 py-3">Ad Soyad</th>
                            <th className="px-4 py-3">E-posta</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Görev</th>
                            <th className="px-4 py-3">KVKK</th>
                            <th className="px-4 py-3">Durum</th>
                            <th className="px-4 py-3">Son Giriş</th>
                            <th className="px-4 py-3">Kayıt</th>
                            <th className="px-4 py-3">Aksiyonlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Yükleniyor...</td></tr>
                        ) : filteredUsers.map((candidate) => (
                            <tr key={candidate.id} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-medium text-slate-900">{candidate.fullName}</td>
                                <td className="px-4 py-3">{candidate.email}</td>
                                <td className="px-4 py-3">
                                    <select value={candidate.role} onChange={(event) => updateRole(candidate.id, event.target.value as 'user' | 'admin')} className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-slate-800">
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-slate-900">{candidate.taskCount}</div>
                                    <div className="text-xs text-slate-500">{candidate.completedTaskCount} tamamlandı</div>
                                </td>
                                <td className="px-4 py-3">{candidate.kvkkConsent ? 'Onaylı' : 'Yok'}</td>
                                <td className="px-4 py-3">
                                    <span className={candidate.active ? adminUi.badgeActive : adminUi.badgeInactive}>
                                        {candidate.active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{formatDateTime(candidate.lastSignInAt)}</td>
                                <td className="px-4 py-3">{formatDateTime(candidate.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link to={`/admin/users/${candidate.id}`} className={adminUi.chip}>Detay</Link>
                                        <button type="button" className={adminUi.buttonSecondary} onClick={() => setEmailConfirmed(candidate.id, !candidate.emailConfirmed)}>Mail</button>
                                        <button type="button" className={adminUi.buttonSecondary} onClick={() => setActive(candidate.id, !candidate.active)}>
                                            {candidate.active ? 'Pasifleştir' : 'Aktifleştir'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
