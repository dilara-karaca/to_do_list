import { useCallback, useEffect, useState } from 'react';
import {
    computeAdminStats,
    fetchActivityLogs,
    fetchAdminUsersWithStats,
    fetchUserTasks,
} from '../lib/adminService';
import { formatAdminError } from '../components/admin/adminUi';
import type { AppUser } from '../types/auth';
import type { ActivityLog, AdminStats, AdminUserSummary } from '../types/admin';
import type { TaskMap } from '../types/task';

const emptyStats: AdminStats = {
    totalUsers: 0,
    activeUsers: 0,
    confirmedUsers: 0,
    unconfirmedUsers: 0,
    kvkkApprovedUsers: 0,
    totalTasks: 0,
    todaySignups: 0,
    last7DaySignups: 0,
};

const mapFallbackSummaries = (users: AppUser[]): AdminUserSummary[] =>
    users.map((user) => ({
        ...user,
        kvkkConsentAt: user.kvkkConsentAt ?? null,
        lastSignInAt: user.lastSignInAt ?? null,
        taskCount: 0,
        completedTaskCount: 0,
        lastTaskDate: null,
    }));

export function useAdminDashboardData(enabled: boolean) {
    const [stats, setStats] = useState<AdminStats>(emptyStats);
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!enabled) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const [usersResult, logsResult] = await Promise.allSettled([
                fetchAdminUsersWithStats(),
                fetchActivityLogs(12),
            ]);

            const nextUsers = usersResult.status === 'fulfilled' ? usersResult.value : [];
            const nextLogs = logsResult.status === 'fulfilled' ? logsResult.value : [];

            setUsers(nextUsers);
            setStats(computeAdminStats(nextUsers));
            setLogs(nextLogs);

            const failures = [usersResult, logsResult].filter((result) => result.status === 'rejected') as PromiseRejectedResult[];
            if (failures.length) {
                setError(formatAdminError(failures[0].reason));
            } else if (!nextUsers.length) {
                setError('Kullanıcı listesi boş. Supabase SQL Editor\'da fix-admin.sql dosyasını çalıştır.');
            } else {
                setError('');
            }
        } catch (caughtError) {
            setError(formatAdminError(caughtError));
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { stats, users, logs, loading, error, refresh };
}

export function useAdminUsersData(enabled: boolean, fallbackUsers: AppUser[]) {
    const [users, setUsers] = useState<AdminUserSummary[]>(mapFallbackSummaries(fallbackUsers));
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!enabled) {
            setUsers(mapFallbackSummaries(fallbackUsers));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const nextUsers = await fetchAdminUsersWithStats();
            setUsers(nextUsers.length ? nextUsers : mapFallbackSummaries(fallbackUsers));
            if (!nextUsers.length) {
                setError('Kullanıcılar yüklenemedi. fix-admin.sql dosyasını Supabase\'de çalıştır.');
            }
        } catch (caughtError) {
            setError(formatAdminError(caughtError));
            setUsers(mapFallbackSummaries(fallbackUsers));
        } finally {
            setLoading(false);
        }
    }, [enabled, fallbackUsers]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { users, loading, error, refresh, setUsers };
}

export function useAdminUserDetail(userId: string | undefined, enabled: boolean, fallbackUsers: AppUser[]) {
    const [user, setUser] = useState<AdminUserSummary | null>(null);
    const [taskMap, setTaskMap] = useState<TaskMap>({});
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!enabled || !userId) {
            const fallback = mapFallbackSummaries(fallbackUsers).find((candidate) => candidate.id === userId) ?? null;
            setUser(fallback);
            setTaskMap({});
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const [usersResult, tasksResult] = await Promise.allSettled([
                fetchAdminUsersWithStats(),
                fetchUserTasks(userId),
            ]);

            const allUsers = usersResult.status === 'fulfilled' ? usersResult.value : [];
            const nextTasks = tasksResult.status === 'fulfilled' ? tasksResult.value : {};
            const nextUser = allUsers.find((candidate) => candidate.id === userId)
                ?? mapFallbackSummaries(fallbackUsers).find((candidate) => candidate.id === userId)
                ?? null;

            setUser(nextUser);
            setTaskMap(nextTasks);
        } catch (caughtError) {
            setError(formatAdminError(caughtError));
        } finally {
            setLoading(false);
        }
    }, [enabled, fallbackUsers, userId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { user, taskMap, loading, error, refresh };
}

export function useAdminActivityData(enabled: boolean) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!enabled) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const nextLogs = await fetchActivityLogs(50);
            setLogs(nextLogs);
        } catch (caughtError) {
            setError(formatAdminError(caughtError));
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { logs, loading, error, refresh };
}
