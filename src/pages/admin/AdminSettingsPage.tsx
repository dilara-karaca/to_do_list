import { adminUi } from '../../components/admin/adminUi';
import { isSupabaseConfigured } from '../../lib/supabase';

export function AdminSettingsPage() {
    return (
        <div className={adminUi.page}>
            <div>
                <div className={adminUi.subtitle}>Ayarlar</div>
                <h1 className={`mt-2 ${adminUi.title}`}>Admin Ayarları</h1>
            </div>

            <section className={adminUi.card}>
                <h2 className={adminUi.sectionTitle}>KVKK Aydınlatma Metni</h2>
                <div className={`mt-4 space-y-3 text-sm leading-7 ${adminUi.muted}`}>
                    <p>
                        Planner uygulaması kapsamında ad soyad, e-posta, profil fotoğrafı, görev/plan verileri ve oturum bilgileri;
                        hesap oluşturma, kimlik doğrulama, planner hizmetinin sunulması ve güvenliğin sağlanması amaçlarıyla işlenir.
                    </p>
                    <p>
                        Kişisel verileriniz yalnızca hizmetin sunulması için gerekli süre boyunca saklanır. KVKK kapsamındaki haklarınız için
                        uygulama yöneticisiyle iletişime geçebilirsiniz.
                    </p>
                </div>
            </section>

            <section className={adminUi.card}>
                <h2 className={adminUi.sectionTitle}>Sistem Bilgisi</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className={adminUi.cardSoft}>Supabase: {isSupabaseConfigured ? 'Bağlı' : 'Bağlı değil'}</div>
                    <div className={adminUi.cardSoft}>Admin paneli: Aktif</div>
                    <div className={adminUi.cardSoft}>Görev senkronizasyonu: {isSupabaseConfigured ? 'Supabase tasks tablosu' : 'localStorage'}</div>
                    <div className={adminUi.cardSoft}>İlk admin: dilarakaraca550@gmail.com</div>
                    <div className={adminUi.cardSoft}>SQL: fix-tasks.sql + fix-admin.sql</div>
                </div>
            </section>
        </div>
    );
}
