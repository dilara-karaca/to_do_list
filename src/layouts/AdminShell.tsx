import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Kullanıcılar' },
    { to: '/admin/planner/user-1', label: 'Planner Görüntüleme' },
    { to: '/admin/stats', label: 'İstatistikler' },
    { to: '/admin/settings', label: 'Ayarlar' },
];

export function AdminShell() {
    return (
        <div className="grid min-h-screen gap-6 bg-slate-950 px-4 py-4 text-slate-100 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-6">
            <aside className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="rounded-[24px] bg-gradient-to-br from-slate-100/10 to-slate-400/10 p-5">
                    <div className="text-xs uppercase tracking-[0.32em] text-slate-400">Admin Panel</div>
                    <h2 className="mt-2 text-2xl font-semibold">Planner Control</h2>
                    <p className="mt-2 text-sm text-slate-300">Kullanıcı, görev ve kayıt akışlarını yönetin.</p>
                </div>

                <nav className="mt-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `block rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <section className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:p-6">
                <Outlet />
            </section>
        </div>
    );
}
