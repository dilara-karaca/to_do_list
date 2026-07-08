import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true,
        },
    })
    : null;

export const supabaseConfig = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
};

export const authRedirectUrl = () => `${window.location.origin}/auth/callback`;

export const AVATAR_BUCKET = 'avatars';
