import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authRedirectUrl, AVATAR_BUCKET, isSupabaseConfigured, resetPasswordRedirectUrl, supabase } from '../lib/supabase';
import type { AppUser, AuthSessionState, UserRole } from '../types/auth';
import { fetchAdminUsers, fetchUserProfile, updateAdminUser } from '../lib/adminService';
import { getAvatarExtension, prepareAvatarImage, readFileAsDataUrl, validateAvatarFile } from '../utils/avatar';
import { getResetCooldownRemaining, mapAuthErrorMessage, setResetCooldown } from '../utils/authErrors';
import { mockUsers } from './mockData';

type AuthContextValue = AuthSessionState & {
    signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
    signUp: (payload: { fullName: string; email: string; password: string; passwordConfirm: string; kvkkConsent: boolean }) => Promise<{ ok: boolean; message: string }>;
    requestPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;
    changePassword: (payload: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) => Promise<{ ok: boolean; message: string }>;
    signOut: () => void;
    updateRole: (userId: string, role: UserRole) => void;
    updateProfile: (userId: string, changes: Partial<AppUser>) => void;
    uploadAvatar: (file: File) => Promise<{ ok: boolean; message: string }>;
    removeAvatar: () => Promise<{ ok: boolean; message: string }>;
    setEmailConfirmed: (userId: string, confirmed: boolean) => void;
    setActive: (userId: string, active: boolean) => void;
    users: AppUser[];
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = 'planner-auth-state';
const profileStorageKey = 'planner-profile-state';

const emailPattern = /^\S+@\S+\.\S+$/;

const isStrongPassword = (password: string) =>
    password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

const readUsers = (): AppUser[] => {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return mockUsers;
        }

        const parsed = JSON.parse(raw) as { users?: AppUser[] };
        return parsed.users?.length ? parsed.users : mockUsers;
    } catch {
        return mockUsers;
    }
};

const mergeUsers = (currentUsers: AppUser[], nextUser: AppUser) => {
    const exists = currentUsers.some((candidate) => candidate.id === nextUser.id);
    if (exists) {
        return currentUsers.map((candidate) => (candidate.id === nextUser.id ? nextUser : candidate));
    }

    return [nextUser, ...currentUsers];
};

const getStoredProfile = (userId: string | null) => {
    try {
        if (!userId) {
            return null;
        }

        const raw = localStorage.getItem(profileStorageKey);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Record<string, AppUser>;
        return parsed[userId] ?? null;
    } catch {
        return null;
    }
};

const saveStoredProfile = (profile: AppUser) => {
    try {
        const raw = localStorage.getItem(profileStorageKey);
        const parsed = raw ? (JSON.parse(raw) as Record<string, AppUser>) : {};
        parsed[profile.id] = profile;
        localStorage.setItem(profileStorageKey, JSON.stringify(parsed));
    } catch {
        // Ignore local profile persistence errors.
    }
};

const buildAppUserFromSession = (sessionUser: User, storedProfile: AppUser | null): AppUser => {
    const avatarFromSession = typeof sessionUser.user_metadata?.avatar_url === 'string'
        ? sessionUser.user_metadata.avatar_url
        : null;

    const fromSession: AppUser = {
        id: sessionUser.id,
        fullName: String(sessionUser.user_metadata?.full_name ?? sessionUser.email ?? ''),
        email: sessionUser.email ?? '',
        role: (sessionUser.app_metadata?.role as UserRole | undefined) ?? 'user',
        emailConfirmed: Boolean(sessionUser.email_confirmed_at),
        kvkkConsent: Boolean(sessionUser.user_metadata?.kvkk_consent),
        kvkkConsentAt: typeof sessionUser.user_metadata?.kvkk_consent_at === 'string'
            ? sessionUser.user_metadata.kvkk_consent_at
            : null,
        createdAt: sessionUser.created_at,
        updatedAt: sessionUser.updated_at ?? sessionUser.created_at,
        lastSignInAt: sessionUser.last_sign_in_at ?? null,
        active: true,
        avatarUrl: avatarFromSession,
    };

    if (!storedProfile) {
        return fromSession;
    }

    return {
        ...storedProfile,
        ...fromSession,
        fullName: storedProfile.fullName || fromSession.fullName,
        active: storedProfile.active ?? fromSession.active,
        emailConfirmed: fromSession.emailConfirmed || storedProfile.emailConfirmed,
        kvkkConsent: storedProfile.kvkkConsent || fromSession.kvkkConsent,
        kvkkConsentAt: storedProfile.kvkkConsentAt ?? fromSession.kvkkConsentAt,
        avatarUrl: avatarFromSession || storedProfile.avatarUrl || null,
    };
};

const hydrateAppUser = async (sessionUser: User): Promise<AppUser> => {
    const storedProfile = getStoredProfile(sessionUser.id);
    let nextUser = buildAppUserFromSession(sessionUser, storedProfile);
    const dbUser = await fetchUserProfile(sessionUser.id);

    if (dbUser) {
        nextUser = {
            ...nextUser,
            ...dbUser,
            fullName: dbUser.fullName || nextUser.fullName,
            avatarUrl: nextUser.avatarUrl ?? dbUser.avatarUrl ?? null,
        };
    }

    return nextUser;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [users, setUsers] = useState<AppUser[]>(() => readUsers());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isSupabaseConfigured && supabase) {
            const applySessionUser = async (sessionUser: User | null) => {
                if (!sessionUser) {
                    setUser(null);
                    return;
                }

                const nextUser = await hydrateAppUser(sessionUser);

                setUsers((currentUsers) => mergeUsers(currentUsers, nextUser));
                setUser(nextUser);
                saveStoredProfile(nextUser);

                if (nextUser.role === 'admin') {
                    const adminUsers = await fetchAdminUsers();
                    if (adminUsers.length) {
                        setUsers(adminUsers);
                    }
                }
            };

            const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
                if (import.meta.env.DEV) {
                    console.log('[auth] onAuthStateChange', event, session?.user?.email);
                }

                void applySessionUser(session?.user ?? null);

                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                    setLoading(false);
                }
            });

            return () => {
                subscription.subscription.unsubscribe();
            };
        }

        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw) as { userId?: string; users?: AppUser[] };
                if (parsed.users?.length) {
                    setUsers(parsed.users);
                }
                if (parsed.userId) {
                    setUser(parsed.users?.find((candidate) => candidate.id === parsed.userId) ?? null);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify({ userId: user?.id ?? null, users }));
    }, [user, users]);

    const signIn = async (email: string, password: string) => {
        if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (import.meta.env.DEV) {
                console.log('[auth] signInWithPassword session', await supabase.auth.getSession());
            }

            if (error || !data.user) {
                return { ok: false, message: error?.message ?? 'Giriş yapılamadı.' };
            }

            const nextUser = await hydrateAppUser(data.user);

            setUsers((currentUsers) => mergeUsers(currentUsers, nextUser));
            setUser(nextUser);
            saveStoredProfile(nextUser);
            return { ok: true, message: 'Giriş başarılı.' };
        }

        const matched = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

        if (!matched) {
            return { ok: false, message: 'Kullanıcı bulunamadı.' };
        }

        if (!matched.active) {
            return { ok: false, message: 'Hesap pasifleştirilmiş.' };
        }

        if (!password.trim()) {
            return { ok: false, message: 'Şifre gerekli.' };
        }

        const nextUser = { ...matched, lastSignInAt: new Date().toISOString() };
        setUser(nextUser);
        setUsers((currentUsers) => currentUsers.map((candidate) => (candidate.id === matched.id ? nextUser : candidate)));
        return { ok: true, message: 'Giriş başarılı.' };
    };

    const signUp = async ({ fullName, email, password, passwordConfirm, kvkkConsent }: { fullName: string; email: string; password: string; passwordConfirm: string; kvkkConsent: boolean }) => {
        if (!fullName.trim()) return { ok: false, message: 'Ad soyad gerekli.' };
        if (!emailPattern.test(email)) return { ok: false, message: 'Geçerli bir e-posta girin.' };
        if (!kvkkConsent) return { ok: false, message: 'Kayıt olmak için KVKK metnini onaylamalısın.' };
        if (password !== passwordConfirm) return { ok: false, message: 'Şifreler eşleşmiyor.' };
        if (!isStrongPassword(password)) return { ok: false, message: 'Şifre güçlü değil.' };

        const consentAt = new Date().toISOString();

        if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: authRedirectUrl(),
                    data: {
                        full_name: fullName,
                        kvkk_consent: true,
                        kvkk_consent_at: consentAt,
                    },
                },
            });

            if (error) {
                const normalizedMessage = error.message.toLowerCase();
                if (normalizedMessage.includes('user already registered') || normalizedMessage.includes('email already registered') || normalizedMessage.includes('already exists')) {
                    return { ok: false, message: 'Bu e-posta zaten kayıtlı.' };
                }

                return { ok: false, message: error.message };
            }

            if (data.user) {
                const nextUser = buildAppUserFromSession(data.user, null);
                const profileUser: AppUser = {
                    ...nextUser,
                    fullName,
                    kvkkConsent: true,
                    kvkkConsentAt: consentAt,
                };

                setUsers((currentUsers) => mergeUsers(currentUsers, profileUser));
                saveStoredProfile(profileUser);
            }

            return { ok: true, message: 'Doğrulama e-postası gönderildi. Mailini kontrol et.' };
        }

        const now = new Date().toISOString();
        const nextUser: AppUser = {
            id: crypto.randomUUID(),
            fullName,
            email,
            role: 'user',
            emailConfirmed: false,
            kvkkConsent: true,
            kvkkConsentAt: consentAt,
            createdAt: now,
            updatedAt: now,
            lastSignInAt: null,
            active: true,
            avatarUrl: null,
        };

        setUsers((currentUsers) => [nextUser, ...currentUsers]);
        return { ok: true, message: 'Doğrulama e-postası gönderildi.' };
    };

    const requestPasswordReset = async (email: string) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!emailPattern.test(normalizedEmail)) {
            return { ok: false, message: 'Geçerli bir e-posta girin.' };
        }

        const cooldownRemaining = getResetCooldownRemaining(normalizedEmail);
        if (cooldownRemaining > 0) {
            const seconds = Math.ceil(cooldownRemaining / 1000);
            return { ok: false, message: `Yeni mail isteği için ${seconds} saniye beklemen gerekiyor.` };
        }

        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo: resetPasswordRedirectUrl(),
            });

            if (error) {
                return {
                    ok: false,
                    message: mapAuthErrorMessage(error.message, error.code),
                };
            }

            setResetCooldown(normalizedEmail);
            return { ok: true, message: 'Şifre sıfırlama maili gönderildi. Gelen kutunu ve spam klasörünü kontrol et.' };
        }

        const exists = users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail);
        return { ok: exists, message: exists ? 'Şifre sıfırlama bağlantısı gönderildi.' : 'E-posta bulunamadı.' };
    };

    const changePassword = async ({ currentPassword, newPassword, newPasswordConfirm }: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) => {
        if (!currentPassword.trim()) {
            return { ok: false, message: 'Mevcut şifre gerekli.' };
        }

        if (newPassword !== newPasswordConfirm) {
            return { ok: false, message: 'Yeni şifreler eşleşmiyor.' };
        }

        if (!isStrongPassword(newPassword)) {
            return { ok: false, message: 'Yeni şifre güçlü değil. En az 10 karakter, büyük/küçük harf, rakam ve özel karakter içermeli.' };
        }

        if (isSupabaseConfigured && supabase && user) {
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (verifyError) {
                return { ok: false, message: 'Mevcut şifre hatalı.' };
            }

            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) {
                return { ok: false, message: error.message };
            }

            return { ok: true, message: 'Şifren başarıyla güncellendi.' };
        }

        return { ok: true, message: 'Şifren başarıyla güncellendi.' };
    };

    const signOut = async () => {
        if (isSupabaseConfigured && supabase) {
            await supabase.auth.signOut();
        }

        setUser(null);
    };

    const persistAdminChange = (userId: string, changes: Partial<AppUser>) => {
        if (isSupabaseConfigured) {
            void updateAdminUser(userId, changes);
        }
    };

    const updateRole = (userId: string, role: UserRole) => {
        persistAdminChange(userId, { role });
        setUsers((currentUsers) => currentUsers.map((candidate) => (candidate.id === userId ? { ...candidate, role, updatedAt: new Date().toISOString() } : candidate)));
        setUser((currentUser) => (currentUser?.id === userId ? { ...currentUser, role } : currentUser));
    };

    const updateProfile = (userId: string, changes: Partial<AppUser>) => {
        setUsers((currentUsers) => currentUsers.map((candidate) => (candidate.id === userId ? { ...candidate, ...changes, updatedAt: new Date().toISOString() } : candidate)));
        setUser((currentUser) => {
            if (currentUser?.id !== userId) {
                return currentUser;
            }

            const nextUser = { ...currentUser, ...changes };
            saveStoredProfile(nextUser);
            return nextUser;
        });
    };

    const uploadAvatar = async (file: File) => {
        const activeUser = user;
        if (!activeUser) {
            return { ok: false, message: 'Kullanıcı bulunamadı.' };
        }

        const validation = validateAvatarFile(file);
        if (!validation.ok) {
            return { ok: false, message: validation.message };
        }

        try {
            const preparedFile = await prepareAvatarImage(file, validation.mimeType);
            const previewUrl = await readFileAsDataUrl(preparedFile);

            updateProfile(activeUser.id, { avatarUrl: previewUrl });

            if (isSupabaseConfigured && supabase) {
                const extension = getAvatarExtension(preparedFile.type || validation.mimeType);
                const filePath = `${activeUser.id}/avatar.${extension}`;
                const contentType = preparedFile.type || validation.mimeType;
                let avatarUrl = previewUrl;

                const { error: uploadError } = await supabase.storage
                    .from(AVATAR_BUCKET)
                    .upload(filePath, preparedFile, { upsert: true, contentType });

                if (!uploadError) {
                    const { data: publicUrl } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
                    avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
                }

                const { error: updateError } = await supabase.auth.updateUser({
                    data: { avatar_url: avatarUrl },
                });

                if (updateError) {
                    return { ok: false, message: updateError.message };
                }

                updateProfile(activeUser.id, { avatarUrl });
                return {
                    ok: true,
                    message: uploadError
                        ? 'Profil fotoğrafı kaydedildi.'
                        : 'Profil fotoğrafı güncellendi.',
                };
            }

            return { ok: true, message: 'Profil fotoğrafı güncellendi.' };
        } catch {
            return { ok: false, message: 'Profil fotoğrafı yüklenemedi.' };
        }
    };

    const removeAvatar = async () => {
        if (!user) {
            return { ok: false, message: 'Kullanıcı bulunamadı.' };
        }

        if (isSupabaseConfigured && supabase) {
            const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);
            if (files?.length) {
                const paths = files.map((fileItem) => `${user.id}/${fileItem.name}`);
                await supabase.storage.from(AVATAR_BUCKET).remove(paths);
            }

            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: null },
            });

            if (error) {
                return { ok: false, message: error.message };
            }
        }

        updateProfile(user.id, { avatarUrl: null });
        return { ok: true, message: 'Profil fotoğrafı kaldırıldı.' };
    };

    const setEmailConfirmed = (userId: string, confirmed: boolean) => {
        persistAdminChange(userId, { emailConfirmed: confirmed });
        updateProfile(userId, { emailConfirmed: confirmed });
    };

    const setActive = (userId: string, active: boolean) => {
        persistAdminChange(userId, { active });
        updateProfile(userId, { active });
    };

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        authenticated: Boolean(user),
        signIn,
        signUp,
        requestPasswordReset,
        changePassword,
        signOut,
        updateRole,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        setEmailConfirmed,
        setActive,
        users,
    }), [loading, user, users]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
