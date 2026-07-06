export function AdminDashboardPage() {
    const cards = ['Toplam Kullanıcı', 'Aktif Kullanıcı', 'Doğrulanmış Hesap', 'Doğrulanmamış Hesap', 'Toplam Planner', 'Toplam Görev', 'Bugünkü Yeni Kayıt', 'Son 7 Günlük Kayıt'];

    return (
        <div className="space-y-6">
            <div>
                <div className="text-xs uppercase tracking-[0.3em] text-rose-300">Admin Dashboard</div>
                <h1 className="mt-2 text-3xl font-semibold text-white">Genel Bakış</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card} className="rounded-[24px] border border-white/10 bg-white/8 p-5">
                        <div className="text-sm text-slate-300">{card}</div>
                        <div className="mt-3 text-3xl font-semibold text-white">—</div>
                    </div>
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-80 rounded-[24px] border border-white/10 bg-white/8 p-5 text-slate-300">Grafik alanı</div>
                <div className="h-80 rounded-[24px] border border-white/10 bg-white/8 p-5 text-slate-300">Trend alanı</div>
            </div>
        </div>
    );
}
