import type { AppUser } from '../types/auth';
import type { ActivityLog, AdminStats, AdminUserSummary, DbTaskRow, DbUserRow } from '../types/admin';
import type { TaskMap } from '../types/task';
import {
    ensureBootstrapAdminRole,
    isBootstrapAdminEmail,
    mapDbUser,
} from './profileService';
import { isSupabaseConfigured, supabase } from './supabase';

export {
    ensureUserProfile,
    fetchUserProfile,
    mapDbUser,
    BOOTSTRAP_ADMIN_EMAIL,
    ensureBootstrapAdminRole,
    isBootstrapAdminEmail,
} from './profileService';

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

type AdminUsersFetchResult = {
    users: AdminUserSummary[];
    source: 'rpc_stats' | 'rpc_users' | 'table' | 'none';
    message?: string;
};

async function loadUsersFromAdminRpc(): Promise<AdminUsersFetchResult> {
    if (!supabase) {
        return { users: [], source: 'none', message: 'Supabase yapılandırılmamış.' };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_users_with_stats');

    if (!rpcError && Array.isArray(rpcData)) {
        if (rpcData.length) {
            return {
                users: (rpcData as AdminUserStatsRow[]).map(mapDbUserSummary),
                source: 'rpc_stats',
            };
        }

        return {
            users: [],
            source: 'rpc_stats',
            message: 'get_admin_users_with_stats boş döndü. public.users içinde role=admin olduğundan emin ol.',
        };
    }

    const { data: usersData, error: usersError } = await supabase.rpc('get_admin_users');

    if (!usersError && Array.isArray(usersData)) {
        if (usersData.length) {
            return {
                users: (usersData as DbUserRow[]).map((row) => mapDbUserSummary({
                    ...row,
                    task_count: 0,
                    completed_task_count: 0,
                    last_task_date: null,
                })),
                source: 'rpc_users',
            };
        }

        return {
            users: [],
            source: 'rpc_users',
            message: 'get_admin_users boş döndü. Hesabın public.users.role değeri admin değil olabilir.',
        };
    }

    const rpcMessage = rpcError?.message || usersError?.message;
    return {
        users: [],
        source: 'none',
        message: rpcMessage
            ? `Admin RPC hatası: ${rpcMessage}`
            : 'Admin RPC fonksiyonları bulunamadı. fix-admin.sql çalıştır.',
    };
}

export async function fetchAdminUsers() {
    const result = await fetchAdminUsersDetailed();
    return result.users;
}

export async function fetchAdminUsersWithStats(): Promise<AdminUserSummary[]> {
    const result = await fetchAdminUsersDetailed();
    return result.users;
}

export async function fetchAdminUsersDetailed(): Promise<AdminUsersFetchResult> {
    if (!isSupabaseConfigured || !supabase) {
        return { users: [], source: 'none', message: 'Supabase yapılandırılmamış.' };
    }

    try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData.session?.user;
        const sessionEmail = sessionUser?.email ?? '';

        if (sessionUser && isBootstrapAdminEmail(sessionEmail)) {
            await ensureBootstrapAdminRole({
                id: sessionUser.id,
                fullName: String(sessionUser.user_metadata?.full_name ?? sessionEmail),
                email: sessionEmail,
                role: 'admin',
                emailConfirmed: Boolean(sessionUser.email_confirmed_at),
                kvkkConsent: Boolean(sessionUser.user_metadata?.kvkk_consent),
                kvkkConsentAt: typeof sessionUser.user_metadata?.kvkk_consent_at === 'string'
                    ? sessionUser.user_metadata.kvkk_consent_at
                    : null,
                createdAt: sessionUser.created_at,
                updatedAt: sessionUser.updated_at ?? sessionUser.created_at,
                lastSignInAt: sessionUser.last_sign_in_at ?? null,
                active: true,
                avatarUrl: null,
            });
        }

        let fromRpc = await loadUsersFromAdminRpc();
        if (fromRpc.users.length) {
            return fromRpc;
        }

        // Bootstrap admin: promote then retry once (DB role may have lagged).
        if (sessionUser && isBootstrapAdminEmail(sessionEmail) && fromRpc.source !== 'none') {
            await ensureBootstrapAdminRole({
                id: sessionUser.id,
                fullName: String(sessionUser.user_metadata?.full_name ?? sessionEmail),
                email: sessionEmail,
                role: 'admin',
                emailConfirmed: Boolean(sessionUser.email_confirmed_at),
                kvkkConsent: Boolean(sessionUser.user_metadata?.kvkk_consent),
                kvkkConsentAt: typeof sessionUser.user_metadata?.kvkk_consent_at === 'string'
                    ? sessionUser.user_metadata.kvkk_consent_at
                    : null,
                createdAt: sessionUser.created_at,
                updatedAt: sessionUser.updated_at ?? sessionUser.created_at,
                lastSignInAt: sessionUser.last_sign_in_at ?? null,
                active: true,
                avatarUrl: null,
            });
            fromRpc = await loadUsersFromAdminRpc();
            if (fromRpc.users.length) {
                return fromRpc;
            }
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length) {
            return {
                users: (data as DbUserRow[]).map((row) => mapDbUserSummary({
                    ...row,
                    task_count: 0,
                    completed_task_count: 0,
                    last_task_date: null,
                })),
                source: 'table',
            };
        }

        return {
            users: [],
            source: fromRpc.source === 'none' ? 'none' : fromRpc.source,
            message: error?.message
                || fromRpc.message
                || 'Kullanıcı listesi boş. Supabase SQL Editor\'da fix-admin-now.sql dosyasını çalıştır.',
        };
    } catch (caughtError) {
        const message = caughtError instanceof TypeError && /failed to fetch/i.test(caughtError.message)
            ? 'Supabase bağlantısı kurulamadı (Failed to fetch). URL/anon key ve ağ bağlantısını kontrol et.'
            : caughtError instanceof Error
                ? caughtError.message
                : 'Kullanıcılar yüklenemedi.';

        return { users: [], source: 'none', message };
    }
}

export function computeAdminStats(users: AdminUserSummary[]): AdminStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    return {
        totalUsers: users.length,
        activeUsers: users.filter((user) => user.active).length,
        confirmedUsers: users.filter((user) => user.emailConfirmed).length,
        unconfirmedUsers: users.filter((user) => !user.emailConfirmed).length,
        kvkkApprovedUsers: users.filter((user) => user.kvkkConsent).length,
        totalTasks: users.reduce((total, user) => total + user.taskCount, 0),
        todaySignups: users.filter((user) => new Date(user.createdAt) >= todayStart).length,
        last7DaySignups: users.filter((user) => new Date(user.createdAt) >= weekStart).length,
    };
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
    const users = await fetchAdminUsersWithStats();
    return computeAdminStats(users);
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

    try {
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
    } catch {
        return [];
    }
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
