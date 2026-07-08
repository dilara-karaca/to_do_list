import { isSupabaseConfigured } from '../../lib/supabase';

export function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <div className="text-xs uppercase tracking-[0.3em] text-rose-300">Ayarlar</div>
                <h1 className="mt-2 text-3xl font-semibold text-white">Admin Ayarları</h1>
            </div>

            <section className="rounded-[24px] border border-white/10 bg-white/8 p-6">
                <h2 className="text-lg font-semibold text-white">KVKK Aydınlatma Metni</h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                    <p>
                        Planner uygulaması kapsamında ad soyad, e-posta, profil fotoğrafı, görev/plan verileri ve oturum bilgileri;
                        hesap oluşturma, kimlik doğrulama, planner hizmetinin sunulması ve güvenliğin sağlanması amaçlarıyla işlenir.
                    </p>
                    <p>
                        Kişisel verileriniz yalnızca hizmetin sunulması için gerekli süre boyunca saklanır. KVKK kapsamındaki haklarınız için
                        uygulama yöneticisiyle iletişime geçebilirsiniz.
                    </p>
                    <p>
                        Kayıt sırasında kullanıcıdan açık rıza/onay alınır ve bu bilgi kullanıcı profilinde saklanır.
                    </p>
                </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-white/8 p-6">
                <h2 className="text-lg font-semibold text-white">Sistem Bilgisi</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        Supabase: {isSupabaseConfigured ? 'Bağlı' : 'Bağlı değil'}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        Admin paneli: Aktif
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        Görev senkronizasyonu: {isSupabaseConfigured ? 'Supabase tasks tablosu' : 'localStorage'}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        İlk admin ataması: Supabase `public.users.role = 'admin'`
                    </div>
                </div>
            </section>
        </div>
    );
}
