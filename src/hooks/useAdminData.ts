import { useCallback, useEffect, useState } from 'react';
import { fetchActivityLogs, fetchAdminStats, fetchAdminUsers } from '../lib/adminService';
import type { AppUser } from '../types/auth';
import type { ActivityLog, AdminStats } from '../types/admin';

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

export function useAdminDashboardData(enabled: boolean) {
    const [stats, setStats] = useState<AdminStats>(emptyStats);
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
            const [nextStats, nextLogs] = await Promise.all([
                fetchAdminStats(),
                fetchActivityLogs(12),
            ]);
            setStats(nextStats);
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

    return { stats, logs, loading, error, refresh };
}

export function useAdminUsersData(enabled: boolean, fallbackUsers: AppUser[]) {
    const [users, setUsers] = useState<AppUser[]>(fallbackUsers);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!enabled) {
            setUsers(fallbackUsers);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const nextUsers = await fetchAdminUsers();
            setUsers(nextUsers.length ? nextUsers : fallbackUsers);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Kullanıcılar yüklenemedi.');
            setUsers(fallbackUsers);
        } finally {
            setLoading(false);
        }
    }, [enabled, fallbackUsers]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { users, loading, error, refresh, setUsers };
}
