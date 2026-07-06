import { useAuth } from '../auth/AuthProvider';

export function ProfilePage() {
    const { user } = useAuth();

    return (
        <section className="glass-card rounded-[28px] p-6">
            <h1 className="text-2xl font-semibold text-slate-900">Profil</h1>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div>Ad Soyad: {user?.fullName}</div>
                <div>E-posta: {user?.email}</div>
                <div>Rol: {user?.role}</div>
                <div>Doğrulandı: {user?.emailConfirmed ? 'Evet' : 'Hayır'}</div>
            </div>
        </section>
    );
}
