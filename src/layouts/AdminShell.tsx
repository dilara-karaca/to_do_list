import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, LayoutDashboard, LogOut, Settings, Shield, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Motion } from '../utils/motion';

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Kullanıcılar', icon: Users },
    { to: '/admin/activity', label: 'Aktivite', icon: Activity },
    { to: '/admin/settings', label: 'Ayarlar', icon: Settings },
];

function AdminEntryOverlay() {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-md">
            <Motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="glass-panel rounded-[28px] px-8 py-6 text-center shadow-2xl"
            >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                    <Shield className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Panel</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">Yönetim paneline geçiliyor...</div>
            </Motion.div>
        </div>
    );
}

export function AdminShell() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setReady(true), 420);
        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <>
            {!ready ? <AdminEntryOverlay /> : null}

            <Motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 18 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="min-h-screen px-4 py-4 text-slate-800 sm:px-6 lg:px-8 lg:py-6"
            >
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="glass-panel rounded-[30px] p-4">
                        <div className="rounded-[24px] border border-white/70 bg-white/70 p-5">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Admin Panel</div>
                                    <h2 className="text-xl font-semibold text-slate-900">Planner Control</h2>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">{user?.fullName}</p>
                        </div>

                        <nav className="mt-6 space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/admin'}
                                    className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="mt-6 space-y-2 border-t border-white/70 pt-4">
                            <Link to="/planner" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-600 transition hover:bg-white/70 hover:text-slate-900">
                                <ArrowLeft className="h-4 w-4" />
                                Uygulamaya Dön
                            </Link>
                            <button type="button" onClick={() => void signOut().then(() => navigate('/login', { replace: true }))} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50">
                                <LogOut className="h-4 w-4" />
                                Çıkış Yap
                            </button>
                        </div>
                    </aside>

                    <section className="glass-panel rounded-[30px] p-4 lg:p-6">
                        <Outlet />
                    </section>
                </div>
            </Motion.div>
        </>
    );
}
