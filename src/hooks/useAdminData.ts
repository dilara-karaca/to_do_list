import { useCallback, useEffect, useState } from 'react';
import {
    fetchActivityLogs,
    fetchAdminStats,
    fetchAdminUserById,
    fetchAdminUsersWithStats,
    fetchUserTasks,
} from '../lib/adminService';
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
            const [nextStats, nextUsers, nextLogs] = await Promise.all([
                fetchAdminStats(),
                fetchAdminUsersWithStats(),
                fetchActivityLogs(12),
            ]);
            setStats(nextStats);
            setUsers(nextUsers);
            setLogs(nextLogs);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Admin verileri yüklenemedi.');
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
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Kullanıcılar yüklenemedi.');
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
            const [nextUser, nextTasks] = await Promise.all([
                fetchAdminUserById(userId),
                fetchUserTasks(userId),
            ]);

            if (!nextUser) {
                const fallback = mapFallbackSummaries(fallbackUsers).find((candidate) => candidate.id === userId) ?? null;
                setUser(fallback);
            } else {
                setUser(nextUser);
            }

            setTaskMap(nextTasks);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Kullanıcı detayı yüklenemedi.');
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
            setError(caughtError instanceof Error ? caughtError.message : 'Aktivite kayıtları yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { logs, loading, error, refresh };
}
