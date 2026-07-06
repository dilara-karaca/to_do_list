import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Motion } from '../utils/motion';

export function AppShell() {
    const { user, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const avatarLabel = useMemo(() => user?.fullName?.slice(0, 2).toUpperCase() ?? 'PL', [user?.fullName]);

    return (
        <div className="min-h-screen px-4 py-4 text-slate-800 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/50 px-4 py-3 backdrop-blur-xl">
                <Link to="/planner" className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg">PL</div>
                    <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Planner</div>
                        <div className="text-sm text-slate-700">Planlarını güvenle yönet.</div>
                    </div>
                </Link>

                <nav className="hidden items-center gap-2 md:flex">
                    <NavLink className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`} to="/planner">Planner</NavLink>
                    <NavLink className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`} to="/profile">Profil</NavLink>
                    <NavLink className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70'}`} to="/settings">Ayarlar</NavLink>
                </nav>

                <div className="relative">
                    <Motion.button whileTap={{ scale: 0.96 }} onClick={() => setMenuOpen((current) => !current)} className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-950 to-slate-700 text-xs font-semibold text-white">{avatarLabel}</div>
                        <div className="hidden text-left sm:block">
                            <div className="text-sm font-medium text-slate-800">{user?.fullName}</div>
                            <div className="text-xs text-slate-500">{user?.role}</div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                    </Motion.button>

                    {menuOpen ? (
                        <div className="absolute right-0 top-14 z-20 w-56 rounded-3xl border border-white/70 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
                            <Link className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100" to="/profile"><User className="h-4 w-4" />Profil</Link>
                            <Link className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100" to="/settings"><Settings className="h-4 w-4" />Şifre Değiştir</Link>
                            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={signOut}><LogOut className="h-4 w-4" />Çıkış Yap</button>
                        </div>
                    ) : null}
                </div>
            </div>

            <main className="mx-auto mt-6 w-full max-w-7xl">
                <Outlet />
            </main>
        </div>
    );
}
