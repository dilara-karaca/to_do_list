import {
    Eye,
    EyeOff,
    KeyRound,
    LockKeyhole,
    Mail,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { isSupabaseConfigured } from '../lib/supabase';
import { Motion } from '../utils/motion';

const passwordRules = [
    'En az 10 karakter',
    'En az bir büyük harf',
    'En az bir küçük harf',
    'En az bir rakam',
    'En az bir özel karakter',
];

export function SettingsPage() {
    const { user, changePassword, requestPasswordReset, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    const maskedEmail = useMemo(() => {
        if (!user?.email) {
            return '—';
        }

        const [local, domain] = user.email.split('@');
        if (!local || !domain) {
            return user.email;
        }

        const visible = local.slice(0, 2);
        return `${visible}${'•'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
    }, [user?.email]);

    const onChangePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');

        const formData = new FormData(event.currentTarget);
        const result = await changePassword({
            currentPassword: String(formData.get('currentPassword') ?? ''),
            newPassword: String(formData.get('newPassword') ?? ''),
            newPasswordConfirm: String(formData.get('newPasswordConfirm') ?? ''),
        });

        setMessage(result.message);
        setMessageType(result.ok ? 'success' : 'error');
        setLoading(false);

        if (result.ok) {
            event.currentTarget.reset();
        }
    };

    const onSendResetEmail = async () => {
        if (!user?.email) {
            return;
        }

        setResetLoading(true);
        setMessage('');

        const result = await requestPasswordReset(user.email);
        setMessage(result.message);
        setMessageType(result.ok ? 'success' : 'error');
        setResetLoading(false);
    };

    const onDeleteAccount = async () => {
        if (!user || deleteLoading) {
            return;
        }

        if (confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
            setMessage('Hesabı silmek için e-posta adresini doğru yazmalısın.');
            setMessageType('error');
            return;
        }

        const confirmed = window.confirm(
            'Hesabın, görevlerin, profilin ve tüm verilerin kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musun?',
        );
        if (!confirmed) {
            return;
        }

        setDeleteLoading(true);
        setMessage('');

        const result = await deleteAccount();
        setMessage(result.message);
        setMessageType(result.ok ? 'success' : 'error');
        setDeleteLoading(false);

        if (result.ok) {
            navigate('/login', { replace: true });
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Hesap</p>
                    <h1 className="mt-2 bg-gradient-to-r from-slate-950 via-violet-950 to-slate-700 bg-clip-text text-4xl font-semibold tracking-[-0.04em] text-transparent sm:text-5xl">
                        Ayarlar
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                        Şifreni güncelle, hesap güvenliğini yönet ve oturum ayarlarını kontrol et.
                    </p>
                </div>

                <div className="glass-card inline-flex items-center gap-3 self-start rounded-full px-4 py-3 text-sm text-slate-600 lg:self-auto">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Güvenli oturum aktif
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="glass-card rounded-[32px] p-6 sm:p-8"
                >
                    <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Şifre Değiştir</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Güvenliğin için mevcut şifreni doğruladıktan sonra yeni şifreni belirle.
                            </p>
                        </div>
                    </div>

                    {!isSupabaseConfigured ? (
                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Supabase yapılandırılmadığı için şifre değişikliği demo modunda çalışır.
                        </div>
                    ) : null}

                    <form className="mt-6 space-y-4" onSubmit={onChangePassword}>
                        <PasswordField
                            name="currentPassword"
                            label="Mevcut Şifre"
                            show={showCurrentPassword}
                            onToggle={() => setShowCurrentPassword((current) => !current)}
                            placeholder="Mevcut şifreni gir"
                        />
                        <PasswordField
                            name="newPassword"
                            label="Yeni Şifre"
                            show={showNewPassword}
                            onToggle={() => setShowNewPassword((current) => !current)}
                            placeholder="Yeni şifreni gir"
                        />
                        <PasswordField
                            name="newPasswordConfirm"
                            label="Yeni Şifre Tekrar"
                            show={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword((current) => !current)}
                            placeholder="Yeni şifreni tekrar gir"
                        />

                        <div className="rounded-[24px] border border-slate-100 bg-white/60 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Sparkles className="h-4 w-4 text-violet-500" />
                                Güçlü şifre kuralları
                            </div>
                            <ul className="mt-3 space-y-2">
                                {passwordRules.map((rule) => (
                                    <li key={rule} className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>
                </Motion.section>

                <div className="space-y-6">
                    <Motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="glass-card rounded-[28px] p-6 sm:p-8"
                    >
                        <div className="flex items-start gap-4">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Şifremi Unuttum</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Şifreni hatırlamıyorsan kayıtlı e-posta adresine sıfırlama bağlantısı gönderebiliriz.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[24px] border border-slate-100 bg-white/60 p-4">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Kayıtlı E-posta</div>
                            <div className="mt-2 text-sm font-medium text-slate-900">{maskedEmail}</div>
                        </div>

                        <button
                            type="button"
                            onClick={() => void onSendResetEmail()}
                            disabled={resetLoading}
                            className="mt-5 h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            {resetLoading ? 'Gönderiliyor...' : 'Sıfırlama Maili Gönder'}
                        </button>
                    </Motion.section>

                    <Motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="glass-card rounded-[28px] p-6 sm:p-8"
                    >
                        <div className="flex items-start gap-4">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <LockKeyhole className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Güvenlik Özeti</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Hesabınla ilgili temel güvenlik bilgileri.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <SummaryRow label="Hesap" value={user.fullName} />
                            <SummaryRow label="E-posta Doğrulama" value={user.emailConfirmed ? 'Doğrulandı' : 'Bekliyor'} />
                            <SummaryRow label="Hesap Durumu" value={user.active ? 'Aktif' : 'Pasif'} />
                        </div>
                    </Motion.section>
                </div>
            </div>

            <Motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="rounded-[32px] border border-rose-200 bg-rose-50/80 p-6 sm:p-8"
            >
                <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-600 text-white">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-semibold text-rose-950">Hesabı ve Verileri Sil</h2>
                        <p className="mt-1 text-sm leading-6 text-rose-800/80">
                            Bu işlem hesabını, görevlerini, profil fotoğrafını ve tüm uygulama verilerini kalıcı olarak siler. Geri alınamaz.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-rose-900">
                            Onaylamak için e-posta adresini yaz: <span className="font-semibold">{user.email}</span>
                        </span>
                        <input
                            type="email"
                            value={confirmEmail}
                            onChange={(event) => setConfirmEmail(event.target.value)}
                            placeholder={user.email}
                            autoComplete="off"
                            className="h-12 w-full rounded-2xl border border-rose-200 bg-white px-4 text-slate-900 outline-none transition focus:border-rose-400"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={() => void onDeleteAccount()}
                        disabled={deleteLoading}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60 sm:w-auto sm:min-w-[240px] sm:px-6"
                    >
                        <Trash2 className="h-4 w-4" />
                        {deleteLoading ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
                    </button>
                </div>
            </Motion.section>

            {message ? (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${
                    messageType === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}>
                    {message}
                </div>
            ) : null}
        </div>
    );
}

type PasswordFieldProps = {
    name: string;
    label: string;
    placeholder: string;
    show: boolean;
    onToggle: () => void;
};

function PasswordField({ name, label, placeholder, show, onToggle }: PasswordFieldProps) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
            <div className="relative">
                <input
                    name={name}
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 pr-12 outline-none transition focus:border-slate-400"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 transition hover:text-slate-800"
                    aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
        </label>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/60 px-4 py-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-900">{value}</span>
        </div>
    );
}
