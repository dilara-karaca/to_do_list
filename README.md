# Planner

Modern Planner uygulaması için auth, route protection, kullanıcı rolleri ve admin paneli iskeleti.

## Kurulum

```bash
npm install
```

## Çalıştırma

```bash
npm run dev
```

## Ortam Değişkenleri

`VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini `.env` dosyasına ekleyin. Örnek için [.env.example](.env.example) dosyasına bakın.

## Yapı

Klasör özeti için [docs/project-structure.md](docs/project-structure.md) dosyasını kullanın.

## Supabase SQL ve RLS

Tablo şeması, activity log yapısı ve RLS policy'leri için [supabase/schema.sql](supabase/schema.sql) dosyasını uygulayın.

## Durum

Bu sürüm, giriş/kayıt/şifre sıfırlama akışını, kullanıcı rollü route korumasını, admin paneli kabuğunu ve planner ekranını tek bir üretim iskeleti altında toplar.