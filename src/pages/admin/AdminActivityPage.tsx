import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../../auth/AuthProvider';
import { useAdminActivityData } from '../../hooks/useAdminData';

const formatLogAction = (action: string) => action.replace(/_/g, ' ');

export function AdminActivityPage() {
    const { user } = useAuth();
    const { logs, loading, error, refresh } = useAdminActivityData(user?.role === 'admin');

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-rose-300">Aktivite</div>
                    <h1 className="mt-2 text-3xl font-semibold text-white">Sistem Kayıtları</h1>
                    <p className="mt-1 text-sm text-slate-400">Admin işlemleri ve sistem olayları</p>
                </div>
                <button type="button" onClick={() => void refresh()} className="h-11 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white">
                    Yenile
                </button>
            </div>

            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            <div className="overflow-x-auto rounded-[24px] border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm text-slate-200">
                    <thead className="bg-white/5 text-slate-300">
                        <tr>
                            <th className="px-4 py-3">Aksiyon</th>
                            <th className="px-4 py-3">Varlık</th>
                            <th className="px-4 py-3">Detay</th>
                            <th className="px-4 py-3">Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Yükleniyor...</td></tr>
                        ) : logs.length ? logs.map((log) => (
                            <tr key={log.id} className="border-t border-white/10">
                                <td className="px-4 py-3 font-medium capitalize text-white">{formatLogAction(log.action)}</td>
                                <td className="px-4 py-3">
                                    {log.entityType ? `${log.entityType}${log.entityId ? ` / ${log.entityId.slice(0, 8)}...` : ''}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-slate-400">
                                    {Object.keys(log.metadata).length ? JSON.stringify(log.metadata) : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {format(parseISO(log.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Henüz aktivite kaydı yok.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
