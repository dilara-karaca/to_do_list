import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo } from 'react';
import { countCompletedTasksInMap, countTasksInMap } from '../../lib/adminService';
import type { TaskMap } from '../../types/task';

type AdminUserPlannerPanelProps = {
    taskMap: TaskMap;
    loading?: boolean;
    readOnlyLabel?: string;
};

export function AdminUserPlannerPanel({ taskMap, loading = false, readOnlyLabel }: AdminUserPlannerPanelProps) {
    const dates = useMemo(
        () => Object.keys(taskMap).sort((left, right) => right.localeCompare(left)),
        [taskMap],
    );

    const totalTasks = countTasksInMap(taskMap);
    const completedTasks = countCompletedTasksInMap(taskMap);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="text-sm text-slate-400">Toplam Görev</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{totalTasks}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="text-sm text-slate-400">Tamamlanan</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{completedTasks}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="text-sm text-slate-400">Aktif Gün</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{dates.length}</div>
                </div>
            </div>

            {readOnlyLabel ? (
                <div className="rounded-[24px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {readOnlyLabel}
                </div>
            ) : null}

            {loading ? (
                <div className="text-slate-400">Planner verileri yükleniyor...</div>
            ) : dates.length ? dates.map((date) => (
                <div key={date} className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                    <div className="mb-4 text-lg font-semibold text-white">
                        {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: tr })}
                    </div>
                    <div className="space-y-2">
                        {(taskMap[date] ?? []).map((task) => (
                            <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <div className="min-w-0">
                                    <div className="font-medium text-white">{task.text}</div>
                                    {task.description ? <div className="mt-1 text-sm text-slate-400">{task.description}</div> : null}
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${task.completed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-100'}`}>
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
