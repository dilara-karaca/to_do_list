import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo } from 'react';
import { adminUi } from './adminUi';
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
                <div className={adminUi.card}>
                    <div className={adminUi.label}>Toplam Görev</div>
                    <div className={`mt-2 ${adminUi.value}`}>{totalTasks}</div>
                </div>
                <div className={adminUi.card}>
                    <div className={adminUi.label}>Tamamlanan</div>
                    <div className={`mt-2 ${adminUi.value}`}>{completedTasks}</div>
                </div>
                <div className={adminUi.card}>
                    <div className={adminUi.label}>Aktif Gün</div>
                    <div className={`mt-2 ${adminUi.value}`}>{dates.length}</div>
                </div>
            </div>

            {readOnlyLabel ? <div className={adminUi.warning}>{readOnlyLabel}</div> : null}

            {loading ? (
                <div className="text-slate-500">Planner verileri yükleniyor...</div>
            ) : dates.length ? dates.map((date) => (
                <div key={date} className={adminUi.card}>
                    <div className="mb-4 text-lg font-semibold text-slate-900">
                        {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: tr })}
                    </div>
                    <div className="space-y-2">
                        {(taskMap[date] ?? []).map((task) => (
                            <div key={task.id} className={`${adminUi.cardSoft} flex items-center justify-between gap-3`}>
                                <div className="min-w-0">
                                    <div className="font-medium text-slate-900">{task.text}</div>
                                    {task.description ? <div className="mt-1 text-sm text-slate-500">{task.description}</div> : null}
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${task.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                                    {task.completed ? 'Tamamlandı' : 'Bekliyor'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )) : (
                <div className={`${adminUi.card} text-center text-slate-500`}>
                    Bu kullanıcıya ait görev bulunamadı.
                </div>
            )}
        </div>
    );
}
