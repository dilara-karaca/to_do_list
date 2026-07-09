import type { AppUser } from '../types/auth';
import type { DbUserRow } from '../types/admin';
import { isSupabaseConfigured, supabase } from './supabase';

export const BOOTSTRAP_ADMIN_EMAIL = 'dilarakaraca550@gmail.com';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeDbUserRow = (data: unknown): DbUserRow | null => {
    if (!data || typeof data !== 'object') {
        return null;
    }

    if (Array.isArray(data)) {
        const first = data[0];
        return first && typeof first === 'object' && 'id' in first ? (first as DbUserRow) : null;
    }

    return 'id' in data ? (data as DbUserRow) : null;
};

export const mapDbUser = (row: DbUserRow): AppUser => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role?.trim().toLowerCase() === 'admin' ? 'admin' : 'user',
    emailConfirmed: row.email_confirmed,
    kvkkConsent: row.kvkk_consent,
    kvkkConsentAt: row.kvkk_consent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignInAt: row.last_sign_in_at,
    active: row.active,
    avatarUrl: null,
});

const resolveBootstrapRole = (email: string): AppUser['role'] =>
    email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : 'user';

async function fetchUserProfileOnce(userId: string): Promise<AppUser | null> {
    if (!isSupabaseConfigured || !supabase) {
        return null;
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_own_profile');

    if (rpcError && import.meta.env.DEV) {
        console.warn('[profile] get_own_profile failed', rpcError.message);
    }

    const rpcRow = normalizeDbUserRow(rpcData);
    if (rpcRow?.id === userId) {
        return mapDbUser(rpcRow);
    }

    const { data: tableData, error: tableError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (tableError && import.meta.env.DEV) {
        console.warn('[profile] users table read failed', tableError.message);
    }

    if (tableData) {
        return mapDbUser(tableData as DbUserRow);
    }

    return null;
}

export async function fetchUserProfile(userId: string, attempts = 3): Promise<AppUser | null> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const profile = await fetchUserProfileOnce(userId);
        if (profile) {
            return profile;
        }

        if (attempt < attempts - 1) {
            await wait(400 * (attempt + 1));
        }
    }

    return null;
}

export async function ensureUserProfile(user: AppUser): Promise<AppUser | null> {
    if (!isSupabaseConfigured || !supabase) {
        return null;
    }

    const existing = await fetchUserProfile(user.id, 2);
    if (existing) {
        return existing;
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_own_profile');

    if (rpcError && import.meta.env.DEV) {
        console.warn('[profile] ensure_own_profile failed', rpcError.message);
    }

    const ensuredRow = normalizeDbUserRow(rpcData);
    if (ensuredRow) {
        return mapDbUser(ensuredRow);
    }

    const bootstrapRole = resolveBootstrapRole(user.email);
    const { data, error } = await supabase
        .from('users')
        .insert({
            id: user.id,
            full_name: user.fullName,
            email: user.email,
            role: bootstrapRole,
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
            console.warn('[profile] ensureUserProfile insert failed', error?.message, { userId: user.id });
        }
        return null;
    }

    return mapDbUser(data as DbUserRow);
}
