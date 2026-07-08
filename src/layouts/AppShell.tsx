import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, KeyRound, LogOut, User } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserAvatar } from '../components/UserAvatar/UserAvatar';
import { useAuth } from '../auth/AuthProvider';
import { Motion } from '../utils/motion';

const roleLabel: Record<string, string> = {
    user: 'Kullanıcı',
    admin: 'Yönetici',
};

export function AppShell() {
    const { user, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const greetingName = useMemo(() => user?.fullName?.trim().split(/\s+/)[0] ?? '', [user?.fullName]);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

    return (
        <div className="min-h-screen px-4 py-4 text-slate-800 sm:px-6 lg:px-8 lg:py-6">
            <div className="relative z-40 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/50 px-4 py-3 backdrop-blur-xl">
                <Link to="/planner" className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg">PL</div>
                    <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Planner</div>
                        <div className="text-sm text-slate-700">
                            {greetingName ? (
                                <>Merhaba <span className="font-medium text-slate-900">{greetingName}</span></>
                            ) : (
                                'Planlarını güvenle yönet.'
                            )}
                        </div>
                    </div>
                </Link>

                <nav className="hidden items-center gap-2 md:flex">
                    <NavLink className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`} to="/planner">Planner</NavLink>
                    <NavLink className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`} to="/profile">Profil</NavLink>
                    <NavLink className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`} to="/settings">Ayarlar</NavLink>
                </nav>

                <div ref={menuRef} className="relative">
                    <Motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setMenuOpen((current) => !current)}
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        className={`flex items-center gap-3 rounded-full border px-3 py-2 shadow-sm transition ${
                            menuOpen
                                ? 'border-slate-300 bg-white'
                                : 'border-white/70 bg-white/80 hover:bg-white'
                        }`}
                    >
                        <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="sm" variant="header" />
                        <div className="hidden text-left sm:block">
                            <div className="text-sm font-medium text-slate-800">{user?.fullName}</div>
                            <div className="text-xs text-slate-500">{roleLabel[user?.role ?? 'user'] ?? user?.role}</div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition ${menuOpen ? 'rotate-180' : ''}`} />
                    </Motion.button>

                    {menuOpen ? (
                        <>
                            <div className="fixed inset-0 z-40" aria-hidden="true" />
                            <div
                                role="menu"
                                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
                            >
                                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="sm" variant="header" />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</div>
                                            <div className="truncate text-xs text-slate-500">{user?.email}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <MenuLink to="/profile" icon={User} label="Profil" onNavigate={() => setMenuOpen(false)} />
                                    <MenuLink to="/settings" icon={KeyRound} label="Ayarlar" onNavigate={() => setMenuOpen(false)} />
                                </div>

                                <div className="border-t border-slate-100 p-2">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            void signOut();
                                        }}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Çıkış Yap
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            <main className="relative z-0 mx-auto mt-6 w-full max-w-7xl">
                <Outlet />
            </main>
        </div>
    );
}

type MenuLinkProps = {
    to: string;
    icon: typeof User;
    label: string;
    onNavigate: () => void;
};

function MenuLink({ to, icon: Icon, label, onNavigate }: MenuLinkProps) {
    return (
        <Link
            to={to}
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
            <Icon className="h-4 w-4 text-slate-500" />
            {label}
        </Link>
    );
}
