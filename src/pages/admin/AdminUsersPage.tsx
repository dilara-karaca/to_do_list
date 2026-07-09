import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useAdminUsersData } from '../../hooks/useAdminData';

const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
        return '—';
    }

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
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Kullanıcılar</h1>
                    <p className="mt-1 text-sm text-slate-400">{users.length} kayıtlı kullanıcı</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => void refresh()} className="h-12 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white">
                        Yenile
                    </button>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad veya e-posta ile ara" className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400 sm:max-w-sm" />
                </div>
            </div>

            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            <div className="overflow-x-auto rounded-[24px] border border-white/10">
                <table className="w-full min-w-[1100px] text-left text-sm text-slate-200">
                    <thead className="bg-white/5 text-slate-300">
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
                            <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Yükleniyor...</td></tr>
                        ) : filteredUsers.map((candidate) => (
                            <tr key={candidate.id} className="border-t border-white/10">
                                <td className="px-4 py-3 font-medium text-white">{candidate.fullName}</td>
                                <td className="px-4 py-3">{candidate.email}</td>
                                <td className="px-4 py-3">
                                    <select value={candidate.role} onChange={(event) => updateRole(candidate.id, event.target.value as 'user' | 'admin')} className="rounded-xl bg-white/10 px-3 py-2 text-white">
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-white">{candidate.taskCount}</div>
                                    <div className="text-xs text-slate-400">{candidate.completedTaskCount} tamamlandı</div>
                                </td>
                                <td className="px-4 py-3">{candidate.kvkkConsent ? 'Onaylı' : 'Yok'}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-3 py-1 text-xs ${candidate.active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                                        {candidate.active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{formatDateTime(candidate.lastSignInAt)}</td>
                                <td className="px-4 py-3">{formatDateTime(candidate.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link to={`/admin/users/${candidate.id}`} className="rounded-full bg-rose-500/20 px-3 py-2 text-rose-100 hover:bg-rose-500/30">Detay</Link>
                                        <button type="button" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/15" onClick={() => setEmailConfirmed(candidate.id, !candidate.emailConfirmed)}>Mail</button>
                                        <button type="button" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/15" onClick={() => setActive(candidate.id, !candidate.active)}>
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
