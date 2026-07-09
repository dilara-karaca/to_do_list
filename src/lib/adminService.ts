import type { AppUser } from '../types/auth';
import type { ActivityLog, AdminStats, AdminUserSummary, DbTaskRow, DbUserRow } from '../types/admin';
import type { Task, TaskMap } from '../types/task';
import { isSupabaseConfigured, supabase } from './supabase';

const mapDbUser = (row: DbUserRow): AppUser => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role?.trim() === 'admin' ? 'admin' : 'user',
    emailConfirmed: row.email_confirmed,
    kvkkConsent: row.kvkk_consent,
    kvkkConsentAt: row.kvkk_consent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignInAt: row.last_sign_in_at,
    active: row.active,
    avatarUrl: null,
});

type AdminUserStatsRow = DbUserRow & {
    task_count?: number;
    completed_task_count?: number;
    last_task_date?: string | null;
};

const mapDbUserSummary = (row: AdminUserStatsRow): AdminUserSummary => ({
    ...mapDbUser(row),
    kvkkConsentAt: row.kvkk_consent_at ?? null,
    lastSignInAt: row.last_sign_in_at ?? null,
    taskCount: Number(row.task_count ?? 0),
    completedTaskCount: Number(row.completed_task_count ?? 0),
    lastTaskDate: row.last_task_date ?? null,
});

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

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const PROFILE_FETCH_TIMEOUT_MS = 5000;

export async function fetchUserProfile(userId: string): Promise<AppUser | null> {
    if (!isSupabaseConfigured || !supabase) {
        return null;
    }

    try {
        const rpcResult = await Promise.race([
            supabase.rpc('get_own_profile'),
            wait(PROFILE_FETCH_TIMEOUT_MS).then(() => ({ timedOut: true as const })),
        ]);

        if (!('timedOut' in rpcResult)) {
            const { data, error } = rpcResult;

            if (!error && data && typeof data === 'object' && 'id' in data) {
                const row = data as DbUserRow;
                if (row.id === userId) {
                    return mapDbUser(row);
                }
            }
        }

        const tableResult = await Promise.race([
            supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle(),
            wait(PROFILE_FETCH_TIMEOUT_MS).then(() => ({ timedOut: true as const })),
        ]);

        if ('timedOut' in tableResult) {
            return null;
        }

        const { data, error } = tableResult;

        if (error || !data) {
            return null;
        }

        return mapDbUser(data as DbUserRow);
    } catch {
        return null;
    }
}

export async function ensureUserProfile(user: AppUser): Promise<AppUser | null> {
    if (!isSupabaseConfigured || !supabase) {
        return null;
    }

    const existing = await fetchUserProfile(user.id);
    if (existing) {
        return existing;
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_own_profile');

    if (!rpcError && rpcData && typeof rpcData === 'object' && 'id' in rpcData) {
        return mapDbUser(rpcData as DbUserRow);
    }

    const { data, error } = await supabase
        .from('users')
        .insert({
            id: user.id,
            full_name: user.fullName,
            email: user.email,
            role: 'user',
            active: user.active,
            email_confirmed: user.emailConfirmed,
            kvkk_consent: user.kvkkConsent,
            kvkk_consent_at: user.kvkkConsentAt ?? null,
            last_sign_in_at: user.lastSignInAt ?? null,
        })
        .select('*')
        .maybeSingle();

    if (error || !data) {
        if (import.meta.env.DEV) {
            console.warn('[auth] ensureUserProfile failed', error?.message, { userId: user.id });
        }
        return null;
    }

    return mapDbUser(data as DbUserRow);
}

export async function fetchAdminUsers(): Promise<AppUser[]> {
    const summaries = await fetchAdminUsersWithStats();
    return summaries;
}

export async function fetchAdminUsersWithStats(): Promise<AdminUserSummary[]> {
    if (!isSupabaseConfigured || !supabase) {
        return [];
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_users_with_stats');

    if (!rpcError && rpcData) {
        return (rpcData as AdminUserStatsRow[]).map(mapDbUserSummary);
    }

    const { data: usersData, error: usersError } = await supabase.rpc('get_admin_users');

    if (!usersError && usersData) {
        const users = usersData as DbUserRow[];
        const { data: tasksData } = await supabase.from('tasks').select('user_id, completed, date');

        const statsByUser = new Map<string, { taskCount: number; completedTaskCount: number; lastTaskDate: string | null }>();

        for (const task of tasksData ?? []) {
            const current = statsByUser.get(task.user_id) ?? { taskCount: 0, completedTaskCount: 0, lastTaskDate: null };
            current.taskCount += 1;
            if (task.completed) {
                current.completedTaskCount += 1;
            }
            if (!current.lastTaskDate || task.date > current.lastTaskDate) {
                current.lastTaskDate = task.date;
            }
            statsByUser.set(task.user_id, current);
        }

        return users.map((row) => {
            const stats = statsByUser.get(row.id) ?? { taskCount: 0, completedTaskCount: 0, lastTaskDate: null };
            return mapDbUserSummary({
                ...row,
                task_count: stats.taskCount,
                completed_task_count: stats.completedTaskCount,
                last_task_date: stats.lastTaskDate,
            });
        });
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw new Error(error?.message ?? 'Kullanıcılar yüklenemedi.');
    }

    return (data as DbUserRow[]).map((row) => mapDbUserSummary({ ...row, task_count: 0, completed_task_count: 0, last_task_date: null }));
}

export async function fetchAdminUserById(userId: string): Promise<AdminUserSummary | null> {
    const users = await fetchAdminUsersWithStats();
    return users.find((candidate) => candidate.id === userId) ?? null;
}

export async function updateAdminUser(userId: string, changes: Partial<Pick<AppUser, 'role' | 'active' | 'emailConfirmed' | 'fullName'>>) {
    if (!isSupabaseConfigured || !supabase) {
        return { ok: false, message: 'Supabase yapılandırılmamış.' };
    }

    const payload: Record<string, unknown> = {};
    if (changes.role !== undefined) payload.role = changes.role;
    if (changes.active !== undefined) payload.active = changes.active;
    if (changes.emailConfirmed !== undefined) payload.email_confirmed = changes.emailConfirmed;
    if (changes.fullName !== undefined) payload.full_name = changes.fullName;

    const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId);

    if (error) {
        return { ok: false, message: error.message };
    }

    await logActivity('admin_user_updated', 'user', userId, payload);
    return { ok: true, message: 'Kullanıcı güncellendi.' };
}

export async function fetchAdminStats(): Promise<AdminStats> {
    if (!isSupabaseConfigured || !supabase) {
        return {
            totalUsers: 0,
            activeUsers: 0,
            confirmedUsers: 0,
            unconfirmedUsers: 0,
            kvkkApprovedUsers: 0,
            totalTasks: 0,
            todaySignups: 0,
            last7DaySignups: 0,
        };
    }

    const [usersResult, tasksResult] = await Promise.all([
        supabase.from('users').select('id, active, email_confirmed, kvkk_consent, created_at'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
    ]);

    const users = (usersResult.data ?? []) as Array<{
        id: string;
        active: boolean;
        email_confirmed: boolean;
        kvkk_consent: boolean;
        created_at: string;
    }>;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    return {
        totalUsers: users.length,
        activeUsers: users.filter((user) => user.active).length,
        confirmedUsers: users.filter((user) => user.email_confirmed).length,
        unconfirmedUsers: users.filter((user) => !user.email_confirmed).length,
        kvkkApprovedUsers: users.filter((user) => user.kvkk_consent).length,
        totalTasks: tasksResult.count ?? 0,
        todaySignups: users.filter((user) => new Date(user.created_at) >= todayStart).length,
        last7DaySignups: users.filter((user) => new Date(user.created_at) >= weekStart).length,
    };
}

export async function fetchUserTasks(userId: string): Promise<TaskMap> {
    if (!isSupabaseConfigured || !supabase) {
        return {};
    }

    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_user_tasks', {
            p_user_id: userId,
        });

        if (!rpcError && Array.isArray(rpcData)) {
            return mapRowsToTaskMap(rpcData as DbTaskRow[]);
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

export async function fetchActivityLogs(limit = 20): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured || !supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) {
        return [];
    }

    return data.map((row) => ({
        id: row.id,
        actorId: row.actor_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        createdAt: row.created_at,
    }));
}

export async function logActivity(
    action: string,
    entityType?: string,
    entityId?: string,
    metadata: Record<string, unknown> = {},
) {
    if (!isSupabaseConfigured || !supabase) {
        return;
    }

    const { data: sessionData } = await supabase.auth.getSession();

    await supabase.from('activity_logs').insert({
        actor_id: sessionData.session?.user.id ?? null,
        action,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        metadata,
    });
}

export function countTasksInMap(taskMap: TaskMap) {
    return Object.values(taskMap).reduce((total, tasks) => total + tasks.length, 0);
}

export function countCompletedTasksInMap(taskMap: TaskMap) {
    return Object.values(taskMap).reduce(
        (total, tasks) => total + tasks.filter((task) => task.completed).length,
        0,
    );
}

export function getRecentSignIns(users: AdminUserSummary[], limit = 8) {
    return [...users]
        .sort((left, right) => {
            const leftTime = left.lastSignInAt ? new Date(left.lastSignInAt).getTime() : 0;
            const rightTime = right.lastSignInAt ? new Date(right.lastSignInAt).getTime() : 0;
            return rightTime - leftTime;
        })
        .slice(0, limit);
}
