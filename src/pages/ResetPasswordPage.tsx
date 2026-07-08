import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Motion } from '../utils/motion';

const isStrongPassword = (password: string) =>
    password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const handledRef = useRef(false);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Bağlantı doğrulanıyor...');
    const [formMessage, setFormMessage] = useState('');
    const [formMessageType, setFormMessageType] = useState<'success' | 'error'>('success');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    useEffect(() => {
        const client = supabase;
        if (!client) {
            setStatusMessage('Supabase yapılandırılmamış.');
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const markReady = () => {
            if (handledRef.current) {
                return;
            }

            handledRef.current = true;
            setReady(true);
            setStatusMessage('');
            window.history.replaceState(null, '', '/auth/reset-password');
        };

        const fail = (message: string) => {
            setStatusMessage(message);
            window.setTimeout(() => navigate('/login', { replace: true }), 4000);
        };

        const init = async () => {
            const hashParams = new URLSearchParams(window.location.hash.slice(1));
            const query = new URLSearchParams(window.location.search);
            const code = query.get('code');

            if (hashParams.get('type') === 'recovery' || hashParams.get('access_token')) {
                const { data, error } = await client.auth.getSession();
                if (!error && data.session) {
                    markReady();
                    return;
                }
            }

            if (code) {
                const { error } = await client.auth.exchangeCodeForSession(code);
                if (error) {
                    fail('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir mail iste.');
                    return;
                }

                markReady();
                return;
            }

            const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
                if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
                    markReady();
                }
            });

            unsubscribe = () => subscription.subscription.unsubscribe();

            const { data, error } = await client.auth.getSession();
            if (!error && data.session) {
                markReady();
                return;
            }

            if (!window.location.hash.includes('access_token') && !code) {
                fail('Şifre sıfırlama bağlantısı bulunamadı. Lütfen maildeki linki tekrar dene.');
            }
        };

        void init();

        return () => {
            unsubscribe?.();
        };
    }, [navigate]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const client = supabase;
        if (!client) {
            return;
        }

        const formData = new FormData(event.currentTarget);
        const newPassword = String(formData.get('newPassword') ?? '');
        const newPasswordConfirm = String(formData.get('newPasswordConfirm') ?? '');

        if (newPassword !== newPasswordConfirm) {
            setFormMessage('Şifreler eşleşmiyor.');
            setFormMessageType('error');
            return;
        }

        if (!isStrongPassword(newPassword)) {
            setFormMessage('Şifre güçlü değil. En az 10 karakter, büyük/küçük harf, rakam ve özel karakter içermeli.');
            setFormMessageType('error');
            return;
        }

        setLoading(true);
        setFormMessage('');

        const { error } = await client.auth.updateUser({ password: newPassword });

        setLoading(false);

        if (error) {
            setFormMessage(error.message);
            setFormMessageType('error');
            return;
        }

        setFormMessage('Şifren güncellendi. Giriş sayfasına yönlendiriliyorsun...');
        setFormMessageType('success');
        window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="grid min-h-screen place-items-center px-4 text-slate-600">
                Supabase yapılandırılmamış.
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="grid min-h-screen place-items-center px-4 text-slate-500">
                {statusMessage}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.6),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_55%,_#fdf2f8_100%)]" />

            <Motion.main
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-lg items-center justify-center"
            >
                <div className="glass-panel w-full rounded-[32px] p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Yeni Şifre Belirle</h1>
                            <p className="mt-1 text-sm text-slate-500">Hesabın için güçlü bir şifre oluştur.</p>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={onSubmit}>
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Yeni Şifre</span>
                            <div className="relative">
                                <input
                                    name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 pr-12 outline-none focus:border-slate-400"
                                    placeholder="Yeni şifreni gir"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500"
                                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Yeni Şifre Tekrar</span>
                            <div className="relative">
                                <input
                                    name="newPasswordConfirm"
                                    type={showPasswordConfirm ? 'text' : 'password'}
                                    required
                                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 pr-12 outline-none focus:border-slate-400"
                                    placeholder="Yeni şifreni tekrar gir"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm((current) => !current)}
                                    className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500"
                                    aria-label={showPasswordConfirm ? 'Tekrar şifreyi gizle' : 'Tekrar şifreyi göster'}
                                >
                                    {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>

                    {formMessage ? (
                        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                            formMessageType === 'success'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border border-rose-200 bg-rose-50 text-rose-800'
                        }`}>
                            {formMessage}
                        </div>
                    ) : null}

                    <div className="mt-6 text-center text-sm text-slate-500">
                        <Link to="/login" className="font-medium text-slate-800 hover:underline">
                            Giriş sayfasına dön
                        </Link>
                    </div>
                </div>
            </Motion.main>
        </div>
    );
}
