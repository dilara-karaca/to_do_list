import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../../auth/AuthProvider';
import { adminUi } from '../../components/admin/adminUi';
import { useAdminActivityData } from '../../hooks/useAdminData';

const formatLogAction = (action: string) => action.replace(/_/g, ' ');

export function AdminActivityPage() {
    const { user } = useAuth();
    const { logs, loading, error, refresh } = useAdminActivityData(user?.role === 'admin');

    return (
        <div className={adminUi.page}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className={adminUi.subtitle}>Aktivite</div>
                    <h1 className={`mt-2 ${adminUi.title}`}>Sistem Kayıtları</h1>
                    <p className={`mt-1 ${adminUi.muted}`}>Admin işlemleri ve sistem olayları</p>
                </div>
                <button type="button" onClick={() => void refresh()} className={adminUi.buttonSecondary}>Yenile</button>
            </div>

            {error ? <div className={adminUi.error}>{error}</div> : null}

            <div className="overflow-x-auto rounded-[24px] glass-card">
                <table className={`${adminUi.table} min-w-[760px]`}>
                    <thead className={adminUi.tableHead}>
                        <tr>
                            <th className="px-4 py-3">Aksiyon</th>
                            <th className="px-4 py-3">Varlık</th>
                            <th className="px-4 py-3">Detay</th>
                            <th className="px-4 py-3">Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Yükleniyor...</td></tr>
                        ) : logs.length ? logs.map((log) => (
                            <tr key={log.id} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-medium capitalize text-slate-900">{formatLogAction(log.action)}</td>
                                <td className="px-4 py-3">
                                    {log.entityType ? `${log.entityType}${log.entityId ? ` / ${log.entityId.slice(0, 8)}...` : ''}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                    {Object.keys(log.metadata).length ? JSON.stringify(log.metadata) : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {format(parseISO(log.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Henüz aktivite kaydı yok.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
