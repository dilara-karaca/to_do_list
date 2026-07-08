import { Camera } from 'lucide-react';
import { useMemo } from 'react';

type UserAvatarProps = {
    fullName?: string | null;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'hero' | 'header';
    className?: string;
};

const sizeClasses = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl',
    lg: 'h-28 w-28 text-3xl sm:h-32 sm:w-32 sm:text-4xl',
};

const shapeClasses = {
    sm: 'rounded-full',
    md: 'rounded-[28px]',
    lg: 'rounded-[32px]',
};

export function UserAvatar({
    fullName,
    avatarUrl,
    size = 'md',
    variant = 'hero',
    className = '',
}: UserAvatarProps) {
    const label = useMemo(
        () => fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'PL',
        [fullName],
    );

    const sizeClass = sizeClasses[size];
    const shapeClass = shapeClasses[size];
    const fallbackClass = variant === 'header'
        ? 'bg-gradient-to-br from-slate-950 to-slate-700 text-white'
        : 'bg-white/10 text-white ring-4 ring-white/15 backdrop-blur-sm';

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={fullName ? `${fullName} profil fotoğrafı` : 'Profil fotoğrafı'}
                className={`object-cover ${shapeClass} ${sizeClass} ${className}`}
            />
        );
    }

    return (
        <div className={`grid place-items-center font-semibold ${fallbackClass} ${shapeClass} ${sizeClass} ${className}`}>
            {label}
        </div>
    );
}

type AvatarUploadButtonProps = {
    uploading: boolean;
    onSelect: () => void;
};

export function AvatarUploadButton({ uploading, onSelect }: AvatarUploadButtonProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={uploading}
            className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-2xl border-2 border-slate-900 bg-white text-slate-900 shadow-lg transition hover:bg-slate-100 disabled:opacity-60"
            aria-label="Profil fotoğrafı yükle"
        >
            <Camera className="h-4 w-4" />
        </button>
    );
}
