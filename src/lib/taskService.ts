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

export async function fetchOwnTasks(userId: string): Promise<TaskMap> {
    if (!isSupabaseConfigured || !supabase) {
        return {};
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_own_tasks');

    if (!rpcError && rpcData) {
        const rows = rpcData as DbTaskRow[];
        const ownRows = rows.filter((row) => row.user_id === userId);
        if (ownRows.length) {
            return mapRowsToTaskMap(ownRows);
        }
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

    const rows = Object.entries(taskMap).flatMap(([date, tasks]) =>
        tasks.map((task) => ({
            id: task.id,
            user_id: userId,
            title: task.text,
            description: task.description ?? null,
            date,
            completed: task.completed,
            created_at: task.createdAt,
        })),
    );

    const currentTaskIds = new Set(rows.map((row) => row.id));

    if (previousTaskIds?.size) {
        const removedTaskIds = [...previousTaskIds].filter((taskId) => !currentTaskIds.has(taskId));
        if (removedTaskIds.length) {
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('user_id', userId)
                .in('id', removedTaskIds);

            if (deleteError) {
                return { ok: false, message: deleteError.message };
            }
        }
    }

    if (!rows.length) {
        return { ok: true };
    }

    const { error: upsertError } = await supabase.from('tasks').upsert(rows, { onConflict: 'id' });

    if (upsertError) {
        return { ok: false, message: upsertError.message };
    }

    return { ok: true };
}

export async function upsertSingleTask(userId: string, date: string, task: Task): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
        return false;
    }

    const { error } = await supabase.from('tasks').upsert(
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

    return !error;
}

export async function deleteSingleTask(userId: string, taskId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
        return false;
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('id', taskId);

    return !error;
}

export function collectTaskIds(taskMap: TaskMap) {
    return new Set(Object.values(taskMap).flat().map((task) => task.id));
}
