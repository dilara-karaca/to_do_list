import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockPlannerRecords, seedTasksFromRecords } from '../../auth/mockData';
import { useAuth } from '../../auth/AuthProvider';
import { useAdminUsersData } from '../../hooks/useAdminData';
import { countCompletedTasksInMap, countTasksInMap, fetchUserTasks } from '../../lib/adminService';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { TaskMap } from '../../types/task';

export function AdminPlannerViewPage() {
    const { userId } = useParams();
    const { user, users: fallbackUsers } = useAuth();
    const { users } = useAdminUsersData(user?.role === 'admin', fallbackUsers);
    const [taskMap, setTaskMap] = useState<TaskMap>({});
    const [loading, setLoading] = useState(true);

    const selectedUser = useMemo(
        () => users.find((candidate) => candidate.id === userId),
        [userId, users],
    );

    useEffect(() => {
        const load = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            if (isSupabaseConfigured) {
                const remoteTasks = await fetchUserTasks(userId);
                setTaskMap(remoteTasks);
                setLoading(false);
                return;
            }

            setTaskMap(seedTasksFromRecords(mockPlannerRecords.filter((record) => record.userId === userId)));
            setLoading(false);
        };

        void load();
    }, [userId]);

    const dates = useMemo(
        () => Object.keys(taskMap).sort((left, right) => right.localeCompare(left)),
        [taskMap],
    );

    if (!userId) {
        return <div className="text-white">Kullanıcı seçilmedi.</div>;
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-rose-300">Planner Görünümü</div>
                    <h1 className="mt-2 text-3xl font-semibold text-white">{selectedUser?.fullName ?? 'Kullanıcı'}</h1>
                    <p className="mt-1 text-sm text-slate-400">{selectedUser?.email ?? userId}</p>
                </div>
                <Link to="/admin/users" className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white">
                    Kullanıcı listesine dön
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="text-sm text-slate-400">Toplam Görev</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{countTasksInMap(taskMap)}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="text-sm text-slate-400">Tamamlanan</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{countCompletedTasksInMap(taskMap)}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="text-sm text-slate-400">Aktif Gün</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{dates.length}</div>
                </div>
            </div>

            <div className="rounded-[24px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                Bu ekran salt okunurdur. Kullanıcının planner verilerini admin olarak görüntülüyorsun.
            </div>

            {loading ? (
                <div className="text-slate-400">Planner verileri yükleniyor...</div>
            ) : dates.length ? dates.map((date) => (
                <div key={date} className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="mb-4 text-lg font-semibold text-white">
                        {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: tr })}
                    </div>
                    <div className="space-y-2">
                        {(taskMap[date] ?? []).map((task) => (
                            <div key={task.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <div>
                                    <div className="font-medium text-white">{task.text}</div>
                                    {task.description ? <div className="mt-1 text-sm text-slate-400">{task.description}</div> : null}
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs ${task.completed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-100'}`}>
                                    {task.completed ? 'Tamamlandı' : 'Bekliyor'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )) : (
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-8 text-center text-slate-400">
                    Bu kullanıcıya ait görev bulunamadı.
                </div>
            )}
        </div>
    );
}
