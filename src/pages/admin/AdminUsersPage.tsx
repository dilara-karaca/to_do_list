import { useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';

export function AdminUsersPage() {
    const { users, updateRole, setActive, setEmailConfirmed } = useAuth();
    const [query, setQuery] = useState('');

    const filteredUsers = useMemo(
        () => users.filter((user) => [user.fullName, user.email].some((value) => value.toLowerCase().includes(query.toLowerCase()))),
        [query, users],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-semibold text-white">Kullanıcılar</h1>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad veya e-posta ile ara" className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400 sm:max-w-sm" />
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10">
                <table className="w-full text-left text-sm text-slate-200">
                    <thead className="bg-white/5 text-slate-300">
                        <tr>
                            <th className="px-4 py-3">Ad Soyad</th>
                            <th className="px-4 py-3">E-posta</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Mail Doğrulandı mı</th>
                            <th className="px-4 py-3">Durum</th>
                            <th className="px-4 py-3">Aksiyonlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-t border-white/10">
                                <td className="px-4 py-3">{user.fullName}</td>
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3">
                                    <select value={user.role} onChange={(event) => updateRole(user.id, event.target.value as 'user' | 'admin')} className="rounded-xl bg-white/10 px-3 py-2">
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3">{user.emailConfirmed ? 'Evet' : 'Hayır'}</td>
                                <td className="px-4 py-3">{user.active ? 'Aktif' : 'Pasif'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <button className="rounded-full bg-white/10 px-3 py-2">Plannerı Görüntüle</button>
                                        <button className="rounded-full bg-white/10 px-3 py-2">Profili Gör</button>
                                        <button className="rounded-full bg-white/10 px-3 py-2" onClick={() => setEmailConfirmed(user.id, !user.emailConfirmed)}>Mail Durumu</button>
                                        <button className="rounded-full bg-white/10 px-3 py-2" onClick={() => setActive(user.id, !user.active)}>{user.active ? 'Pasifleştir' : 'Aktifleştir'}</button>
                                        <button className="rounded-full bg-rose-500/20 px-3 py-2 text-rose-100">Sil</button>
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
