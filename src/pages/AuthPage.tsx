import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { isSupabaseConfigured } from '../lib/supabase';
import { Motion } from '../utils/motion';

type ViewMode = 'login' | 'register' | 'reset';

export function AuthPage() {
    const { authenticated, signIn, signUp, requestPasswordReset } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<ViewMode>('login');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const redirectTo = useMemo(() => {
        const state = location.state as { from?: string } | null;
        return state?.from ?? '/planner';
    }, [location.state]);

    useEffect(() => {
        const hasAuthParams =
            window.location.hash.includes('access_token') ||
            new URLSearchParams(window.location.search).has('code') ||
            new URLSearchParams(window.location.search).has('token_hash');

        if (hasAuthParams) {
            navigate(`/auth/callback${window.location.search}${window.location.hash}`, { replace: true });
        }
    }, [navigate]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setLoading(true);

        const result = mode === 'login'
            ? await signIn(String(formData.get('email') ?? ''), String(formData.get('password') ?? ''))
            : mode === 'register'
                ? await signUp({
                    fullName: String(formData.get('fullName') ?? ''),
                    email: String(formData.get('email') ?? ''),
                    password: String(formData.get('password') ?? ''),
                    passwordConfirm: String(formData.get('passwordConfirm') ?? ''),
                })
                : await requestPasswordReset(String(formData.get('email') ?? ''));

        setMessage(result.message);
        setLoading(false);

        if (result.ok && mode === 'login') {
            navigate(redirectTo, { replace: true });
        }

        if (result.ok && mode === 'register') {
            setMode('login');
        }
    };

    if (authenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.6),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_55%,_#fdf2f8_100%)]" />

            <Motion.main initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="flex flex-col justify-center">
                        <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl">Planlarını güvenle yönet.</h1>
                    </div>

                    <div className="glass-panel rounded-[32px] p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl sm:p-7">
                        <div className="mb-5 flex gap-2 rounded-2xl bg-slate-900/5 p-1">
                            {(['login', 'register', 'reset'] as const).map((item) => (
                                <button key={item} type="button" onClick={() => setMode(item)} className={`flex-1 rounded-2xl px-3 py-2 text-sm font-medium transition ${mode === item ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`}>
                                    {item === 'login' ? 'Giriş Yap' : item === 'register' ? 'Kayıt Ol' : 'Şifremi Unuttum'}
                                </button>
                            ))}
                        </div>

                        {!isSupabaseConfigured ? (
                            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                Supabase env ayarlı değil. Doğrulama maili göndermek için .env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini tanımlayın.
                            </div>
                        ) : null}

                        <form className="space-y-4" onSubmit={onSubmit}>
                            {mode === 'register' ? <input name="fullName" placeholder="Ad Soyad" className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 outline-none focus:border-slate-400" /> : null}
                            <input name="email" type="email" placeholder="E-posta" className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 outline-none focus:border-slate-400" />
                            {mode !== 'reset' ? (
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Şifre"
                                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 pr-12 outline-none focus:border-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 transition hover:text-slate-800"
                                        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            ) : null}
                            {mode === 'register' ? (
                                <div className="relative">
                                    <input
                                        name="passwordConfirm"
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        placeholder="Şifre Tekrar"
                                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 pr-12 outline-none focus:border-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm((current) => !current)}
                                        className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 transition hover:text-slate-800"
                                        aria-label={showPasswordConfirm ? 'Tekrar şifreyi gizle' : 'Tekrar şifreyi göster'}
                                    >
                                        {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            ) : null}

                            <button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                                {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Mail Gönder'}
                            </button>
                        </form>

                        <div className="mt-4 min-h-6 text-sm text-slate-600">{message}</div>
                    </div>
                </div>
            </Motion.main>
        </div>
    );
}
