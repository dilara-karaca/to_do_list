import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    BadgeCheck,
    CalendarDays,
    Clock3,
    ImagePlus,
    Mail,
    Shield,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AvatarUploadButton, UserAvatar } from '../components/UserAvatar/UserAvatar';
import { useAuth } from '../auth/AuthProvider';
import { Motion } from '../utils/motion';

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—';
    }

    try {
        return format(parseISO(value), 'd MMMM yyyy, HH:mm', { locale: tr });
    } catch {
        return '—';
    }
};

const roleLabel: Record<string, string> = {
    user: 'Kullanıcı',
    admin: 'Yönetici',
};

export function ProfilePage() {
    const { user, uploadAvatar, removeAvatar } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    const memberSince = useMemo(() => {
        if (!user?.createdAt) {
            return '—';
        }

        try {
            return format(parseISO(user.createdAt), 'MMMM yyyy', { locale: tr });
        } catch {
            return '—';
        }
    }, [user?.createdAt]);

    const onSelectFile = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setUploading(true);
        setMessage('');

        const result = await uploadAvatar(file);
        setMessage(result.message);
        setMessageType(result.ok ? 'success' : 'error');
        setUploading(false);
    };

    const onRemoveAvatar = async () => {
        setUploading(true);
        setMessage('');

        const result = await removeAvatar();
        setMessage(result.message);
        setMessageType(result.ok ? 'success' : 'error');
        setUploading(false);
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
                        Profil
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                        Hesap bilgilerini görüntüle ve profil fotoğrafını güncelle.
                    </p>
                </div>

                <div className="glass-card inline-flex items-center gap-3 self-start rounded-full px-4 py-3 text-sm text-slate-600 lg:self-auto">
                    <CalendarDays className="h-4 w-4 text-violet-500" />
                    Üyelik: {memberSince}
                </div>
            </header>

            <Motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="glass-card overflow-hidden rounded-[32px]"
            >
                <div className="relative border-b border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-6 py-8 sm:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_35%)]" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="relative shrink-0 self-start">
                            <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} size="md" />
                            <AvatarUploadButton uploading={uploading} onSelect={onSelectFile} />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*"
                                className="sr-only"
                                onChange={(event) => void onFileChange(event)}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                                {user.fullName}
                            </h2>
                            <p className="mt-1 text-sm text-white/70">{user.email}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                    <Shield className="h-3.5 w-3.5" />
                                    {roleLabel[user.role] ?? user.role}
                                </span>
                                {user.emailConfirmed ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-100">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        E-posta doğrulandı
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-100">
                                        <Mail className="h-3.5 w-3.5" />
                                        E-posta doğrulanmadı
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onSelectFile}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90 disabled:opacity-60"
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    {uploading ? 'Yükleniyor...' : user.avatarUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                                </button>
                                {user.avatarUrl ? (
                                    <button
                                        type="button"
                                        onClick={() => void onRemoveAvatar()}
                                        disabled={uploading}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Kaldır
                                    </button>
                                ) : null}
                            </div>

                            <p className="mt-3 text-xs text-white/60">JPG, PNG, WEBP veya GIF · Maks. 2 MB</p>

                            {message ? (
                                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                                    messageType === 'success'
                                        ? 'bg-emerald-400/15 text-emerald-100'
                                        : 'bg-rose-400/15 text-rose-100'
                                }`}>
                                    {message}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                    <InfoCard icon={UserRound} label="Ad Soyad" value={user.fullName} />
                    <InfoCard icon={Mail} label="E-posta" value={user.email} />
                    <InfoCard icon={Shield} label="Hesap Rolü" value={roleLabel[user.role] ?? user.role} />
                    <InfoCard
                        icon={BadgeCheck}
                        label="E-posta Durumu"
                        value={user.emailConfirmed ? 'Doğrulandı' : 'Bekliyor'}
                        accent={user.emailConfirmed ? 'emerald' : 'amber'}
                    />
                    <InfoCard icon={CalendarDays} label="Hesap Oluşturma" value={formatDate(user.createdAt)} />
                    <InfoCard icon={Clock3} label="Son Giriş" value={formatDate(user.lastSignInAt)} />
                </div>
            </Motion.section>
        </div>
    );
}

type InfoCardProps = {
    icon: typeof UserRound;
    label: string;
    value: string;
    accent?: 'emerald' | 'amber';
};

function InfoCard({ icon: Icon, label, value, accent }: InfoCardProps) {
    const accentClass = accent === 'emerald'
        ? 'text-emerald-600 bg-emerald-50'
        : accent === 'amber'
            ? 'text-amber-600 bg-amber-50'
            : 'text-violet-600 bg-violet-50';

    return (
        <div className="rounded-[24px] border border-white/70 bg-white/60 p-4">
            <div className="flex items-start gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${accentClass}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</div>
                    <div className="mt-1 break-words text-sm font-medium text-slate-900">{value}</div>
                </div>
            </div>
        </div>
    );
}
