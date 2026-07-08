export type UserRole = 'user' | 'admin';

export type AppUser = {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    emailConfirmed: boolean;
    kvkkConsent: boolean;
    kvkkConsentAt?: string | null;
    createdAt: string;
    updatedAt: string;
    lastSignInAt?: string | null;
    active: boolean;
    avatarUrl?: string | null;
};

export type AuthSessionState = {
    user: AppUser | null;
    loading: boolean;
    authenticated: boolean;
};
