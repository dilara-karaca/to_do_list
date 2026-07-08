import type { DbTaskRow } from '../types/admin';
import type { Task, TaskMap } from '../types/task';
import { isSupabaseConfigured, supabase } from './supabase';

const mapRowsToTaskMap = (rows: DbTaskRow[]): TaskMap =>
    rows.reduce<TaskMap>((accumulator, row) => {
        const list = accumulator[row.date] ?? [];
        list.push({
            id: row.id,
            text: row.title,
            description: row.description ?? undefined,
            completed: row.completed,
            createdAt: row.created_at,
            userId: row.user_id,
        });
        accumulator[row.date] = list;
        return accumulator;
    }, {});

export async function ensureTaskStorageReady(): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    const { error } = await supabase.rpc('ensure_own_profile');

    if (error) {
        console.error('[tasks] ensure_own_profile failed', error.message);
        return { ok: false, message: error.message };
    }

    return { ok: true };
}

export async function fetchOwnTasks(userId: string): Promise<TaskMap> {
    if (!isSupabaseConfigured || !supabase) {
        return {};
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_own_tasks');

    if (!rpcError && Array.isArray(rpcData)) {
        const rows = rpcData as DbTaskRow[];
        const ownRows = rows.filter((row) => row.user_id === userId);
        return mapRowsToTaskMap(ownRows);
    }

    if (rpcError) {
        console.warn('[tasks] get_own_tasks failed', rpcError.message);
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error || !data) {
        if (error) {
            console.warn('[tasks] fetch tasks failed', error.message);
        }
        return {};
    }

    return mapRowsToTaskMap(data as DbTaskRow[]);
}

export async function fetchUserTasksById(userId: string): Promise<TaskMap> {
    if (!isSupabaseConfigured || !supabase) {
        return {};
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
}

export async function syncTaskMapForUser(
    userId: string,
    taskMap: TaskMap,
    previousTaskIds?: Set<string>,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    const ready = await ensureTaskStorageReady();
    if (!ready.ok) {
        return ready;
    }

    const currentTaskIds = collectTaskIds(taskMap);

    if (previousTaskIds?.size) {
        const removedTaskIds = [...previousTaskIds].filter((taskId) => !currentTaskIds.has(taskId));
        for (const taskId of removedTaskIds) {
            const deleted = await deleteSingleTask(userId, taskId);
            if (!deleted.ok) {
                return deleted;
            }
        }
    }

    for (const [date, tasks] of Object.entries(taskMap)) {
        for (const task of tasks) {
            const saved = await upsertSingleTask(userId, date, task);
            if (!saved.ok) {
                return saved;
            }
        }
    }

    return { ok: true };
}

export async function upsertSingleTask(
    userId: string,
    date: string,
    task: Task,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    const { error } = await supabase.rpc('upsert_own_task', {
        p_id: task.id,
        p_title: task.text,
        p_description: task.description ?? null,
        p_date: date,
        p_completed: task.completed,
        p_created_at: task.createdAt,
    });

    if (error) {
        console.error('[tasks] upsert_own_task failed', error.message, { userId, taskId: task.id });

        const { error: fallbackError } = await supabase.from('tasks').upsert(
            {
                id: task.id,
                user_id: userId,
                title: task.text,
                description: task.description ?? null,
                date,
                completed: task.completed,
                created_at: task.createdAt,
            },
            { onConflict: 'id' },
        );

        if (fallbackError) {
            return { ok: false, message: fallbackError.message };
        }
    }

    return { ok: true };
}

export async function deleteSingleTask(
    userId: string,
    taskId: string,
): Promise<{ ok: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    const { error } = await supabase.rpc('delete_own_task', { p_id: taskId });

    if (error) {
        console.error('[tasks] delete_own_task failed', error.message, { userId, taskId });

        const { error: fallbackError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', userId)
            .eq('id', taskId);

        if (fallbackError) {
            return { ok: false, message: fallbackError.message };
        }
    }

    return { ok: true };
}

export function collectTaskIds(taskMap: TaskMap) {
    return new Set(Object.values(taskMap).flat().map((task) => task.id));
}
