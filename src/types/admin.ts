export type AdminStats = {
    totalUsers: number;
    activeUsers: number;
    confirmedUsers: number;
    unconfirmedUsers: number;
    kvkkApprovedUsers: number;
    totalTasks: number;
    todaySignups: number;
    last7DaySignups: number;
};

export type AdminUserSummary = {
    id: string;
    fullName: string;
    email: string;
    role: 'user' | 'admin';
    active: boolean;
    emailConfirmed: boolean;
    kvkkConsent: boolean;
    kvkkConsentAt: string | null;
    lastSignInAt: string | null;
    createdAt: string;
    updatedAt: string;
    taskCount: number;
    completedTaskCount: number;
    lastTaskDate: string | null;
};

export type ActivityLog = {
    id: string;
    actorId: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
};

export type DbUserRow = {
    id: string;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
    active: boolean;
    email_confirmed: boolean;
    kvkk_consent: boolean;
    kvkk_consent_at: string | null;
    last_sign_in_at: string | null;
    created_at: string;
    updated_at: string;
};

export type DbTaskRow = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    date: string;
    completed: boolean;
    created_at: string;
    updated_at: string;
    series_id?: string | null;
};
