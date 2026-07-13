import type { AppUser } from '../types/auth';
import type { DbTaskRow } from '../types/admin';
import type { Task, TaskMap } from '../types/task';
import { ensureUserProfile } from './adminService';
import { isSupabaseConfigured, supabase } from './supabase';

const mapRowsToTaskMap = (rows: DbTaskRow[]): TaskMap => {
    const taskMap = rows.reduce<TaskMap>((accumulator, row) => {
        const list = accumulator[row.date] ?? [];
        list.push({
            id: row.id,
            text: row.title,
            description: row.description ?? undefined,
            completed: row.completed,
            createdAt: row.created_at,
            userId: row.user_id,
            seriesId: row.series_id ?? undefined,
        });
        accumulator[row.date] = list;
        return accumulator;
    }, {});

    for (const date of Object.keys(taskMap)) {
        taskMap[date] = [...taskMap[date]].sort(
            (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
    }

    return taskMap;
};
const rpcMissing = (message: string) =>
    /could not find the function|schema cache|PGRST202/i.test(message);

const formatTaskError = (error: unknown) => {
    if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
        return 'Supabase bağlantısı kurulamadı. İnternet bağlantını ve Supabase SQL kurulumunu kontrol et.';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Görev kaydı başarısız oldu.';
};

export async function ensureTaskStorageReady(user: AppUser | null): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase || !user) {
        return { ok: false, message: 'Kullanıcı oturumu bulunamadı.' };
    }

    try {
        const { error: rpcError } = await supabase.rpc('ensure_own_profile');

        if (!rpcError) {
            return { ok: true };
        }

        const profile = await ensureUserProfile(user);
        if (profile) {
            return { ok: true };
        }

        if (rpcMissing(rpcError.message)) {
            return {
                ok: false,
                message: 'Supabase görev fonksiyonları kurulmamış. SQL Editor\'da fix-tasks.sql dosyasını çalıştır.',
            };
        }

        return { ok: false, message: rpcError.message };
    } catch (error) {
        return { ok: false, message: formatTaskError(error) };
    }
}

export async function fetchOwnTasks(userId: string): Promise<TaskMap> {
    if (!isSupabaseConfigured || !supabase) {
        return {};
    }

    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_own_tasks');

        if (!rpcError && Array.isArray(rpcData)) {
            return mapRowsToTaskMap((rpcData as DbTaskRow[]).filter((row) => row.user_id === userId));
        }

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error || !data) {
            return {};
        }

        return mapRowsToTaskMap(data as DbTaskRow[]);
    } catch {
        return {};
    }
}

export async function fetchUserTasksById(userId: string): Promise<TaskMap> {
    if (!isSupabaseConfigured || !supabase) {
        return {};
    }

    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error || !data) {
            return {};
        }

        return mapRowsToTaskMap(data as DbTaskRow[]);
    } catch {
        return {};
    }
}

export async function syncTaskMapForUser(
    user: AppUser,
    taskMap: TaskMap,
    previousTaskIds?: Set<string>,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    const currentTaskIds = collectTaskIds(taskMap);
    const removedTaskIds = previousTaskIds
        ? [...previousTaskIds].filter((taskId) => !currentTaskIds.has(taskId))
        : [];
    const hasUpserts = Object.values(taskMap).some((tasks) => tasks.length > 0);

    if (!removedTaskIds.length && !hasUpserts) {
        return { ok: true };
    }

    try {
        const ready = await ensureTaskStorageReady(user);
        if (!ready.ok) {
            return ready;
        }

        for (const taskId of removedTaskIds) {
            const deleted = await deleteSingleTask(user.id, taskId, user);
            if (!deleted.ok) {
                return deleted;
            }
        }

        for (const [date, tasks] of Object.entries(taskMap)) {
            for (const task of tasks) {
                const saved = await upsertSingleTask(user.id, date, task, user);
                if (!saved.ok) {
                    return saved;
                }
            }
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, message: formatTaskError(error) };
    }
}

export async function upsertSingleTask(
    userId: string,
    date: string,
    task: Task,
    user?: AppUser | null,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    try {
        if (user) {
            const ready = await ensureTaskStorageReady(user);
            if (!ready.ok) {
                return ready;
            }
        }

        const payload = {
            id: task.id,
            user_id: userId,
            title: task.text,
            description: task.description ?? null,
            date,
            completed: task.completed,
            created_at: task.createdAt,
            series_id: task.seriesId ?? null,
        };

        const { error: rpcError } = await supabase.rpc('upsert_own_task', {
            p_id: task.id,
            p_title: task.text,
            p_description: task.description ?? null,
            p_date: date,
            p_completed: task.completed,
            p_created_at: task.createdAt,
            p_series_id: task.seriesId ?? null,
        });

        if (!rpcError) {
            return { ok: true };
        }

        const { error: upsertError } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });

        if (!upsertError) {
            return { ok: true };
        }

        if (rpcMissing(rpcError.message)) {
            return {
                ok: false,
                message: 'Supabase\'de fix-tasks.sql çalıştırılmamış olabilir.',
            };
        }

        return { ok: false, message: upsertError.message };
    } catch (error) {
        return { ok: false, message: formatTaskError(error) };
    }
}

export async function deleteSingleTask(
    userId: string,
    taskId: string,
    user?: AppUser | null,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    try {
        if (user) {
            await ensureTaskStorageReady(user);
        }

        const { error: rpcError } = await supabase.rpc('delete_own_task', { p_id: taskId });

        if (!rpcError) {
            return { ok: true };
        }

        const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', userId)
            .eq('id', taskId);

        if (deleteError) {
            return { ok: false, message: deleteError.message };
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, message: formatTaskError(error) };
    }
}

export async function deleteTaskSeries(
    userId: string,
    seriesId: string,
    taskIds: string[],
    user?: AppUser | null,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    try {
        if (user) {
            await ensureTaskStorageReady(user);
        }

        const { error: rpcError } = await supabase.rpc('delete_own_task_series', {
            p_series_id: seriesId,
        });

        if (!rpcError) {
            return { ok: true };
        }

        for (const taskId of taskIds) {
            const deleted = await deleteSingleTask(userId, taskId, user);
            if (!deleted.ok) {
                return deleted;
            }
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, message: formatTaskError(error) };
    }
}

export async function deleteMultipleTasks(
    userId: string,
    taskIds: string[],
    user?: AppUser | null,
): Promise<{ ok: boolean; message?: string }> {
    for (const taskId of taskIds) {
        const deleted = await deleteSingleTask(userId, taskId, user);
        if (!deleted.ok) {
            return deleted;
        }
    }

    return { ok: true };
}

export function collectTaskIds(taskMap: TaskMap) {
    return new Set(Object.values(taskMap).flat().map((task) => task.id));
}
