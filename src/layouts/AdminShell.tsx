import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, LogOut, Settings, Shield, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Kullanıcılar', icon: Users },
    { to: '/admin/stats', label: 'İstatistikler', icon: BarChart3 },
    { to: '/admin/settings', label: 'Ayarlar', icon: Settings },
];

export function AdminShell() {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-4 text-slate-100 lg:px-6 lg:py-6">
            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
                <aside className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <div className="rounded-[24px] bg-gradient-to-br from-rose-500/20 to-violet-500/10 p-5">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.32em] text-slate-300">Admin Panel</div>
                                <h2 className="text-xl font-semibold text-white">Planner Control</h2>
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">{user?.fullName}</p>
                    </div>

                    <nav className="mt-6 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/admin'}
                                className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                        <Link to="/planner" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
                            <ArrowLeft className="h-4 w-4" />
                            Uygulamaya Dön
                        </Link>
                        <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-rose-200 hover:bg-rose-500/10">
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </aside>

                <section className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:p-6">
                    <Outlet />
                </section>
            </div>
        </div>
    );
}
