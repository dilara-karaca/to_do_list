-- TEK SEFERLIK ADMIN DÜZELTMESİ
-- Supabase Dashboard > SQL Editor > New query > yapıştır > Run
-- Başarılı olunca doğrulama sorgusu role=admin ve user_count > 0 dönmeli.

-- 1) auth.users'da olup public.users'da olmayanları ekle
insert into public.users (
    id, full_name, email, role, email_confirmed, kvkk_consent, active, last_sign_in_at
)
select
    au.id,
    coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.email,
    case when lower(au.email) = 'dilarakaraca550@gmail.com' then 'admin' else 'user' end,
    au.email_confirmed_at is not null,
    coalesce((au.raw_user_meta_data->>'kvkk_consent')::boolean, false),
    true,
    au.last_sign_in_at
from auth.users au
where not exists (select 1 from public.users pu where pu.id = au.id)
on conflict (id) do nothing;

-- 2) Admin rolünü garanti et
update public.users
set role = 'admin', active = true, updated_at = now()
where lower(email) = 'dilarakaraca550@gmail.com';

-- 3) is_admin (RLS için — row_security kapalı, döngü yok)
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    perform set_config('row_security', 'off', true);
    return exists (
        select 1 from public.users
        where id = auth.uid() and role = 'admin'
    );
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- 4) Bootstrap admin claim (istemci girişte çağırır)
create or replace function public.claim_bootstrap_admin()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users;
    user_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if user_email <> 'dilarakaraca550@gmail.com' then
        raise exception 'not bootstrap admin';
    end if;

    perform set_config('row_security', 'off', true);

    insert into public.users (
        id, full_name, email, role, email_confirmed, kvkk_consent, active, last_sign_in_at
    )
    select
        au.id,
        coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
        au.email,
        'admin',
        au.email_confirmed_at is not null,
        coalesce((au.raw_user_meta_data->>'kvkk_consent')::boolean, false),
        true,
        au.last_sign_in_at
    from auth.users au
    where au.id = auth.uid()
    on conflict (id) do update
    set
        role = 'admin',
        active = true,
        email = excluded.email,
        updated_at = now()
    returning * into profile;

    return profile;
end;
$$;

grant execute on function public.claim_bootstrap_admin() to authenticated;

-- 5) ensure_own_profile: bootstrap admin rolünü koru/ata
create or replace function public.ensure_own_profile()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users;
    user_id uuid := auth.uid();
    user_email text := coalesce(auth.jwt()->>'email', '');
    user_name text := coalesce(
        auth.jwt()->'user_metadata'->>'full_name',
        split_part(user_email, '@', 1),
        'Kullanıcı'
    );
    next_role text := case
        when lower(user_email) = 'dilarakaraca550@gmail.com' then 'admin'
        else 'user'
    end;
begin
    if user_id is null then
        raise exception 'not authenticated';
    end if;

    perform set_config('row_security', 'off', true);

    select * into profile from public.users where id = user_id;
    if found then
        if next_role = 'admin' and profile.role is distinct from 'admin' then
            update public.users
            set role = 'admin', active = true, updated_at = now()
            where id = user_id
            returning * into profile;
        end if;
        return profile;
    end if;

    insert into public.users (
        id, full_name, email, role, email_confirmed, kvkk_consent, active
    )
    values (
        user_id,
        user_name,
        coalesce(nullif(user_email, ''), user_id::text || '@users.local'),
        next_role,
        coalesce((auth.jwt()->>'email_confirmed')::boolean, false),
        coalesce((auth.jwt()->'user_metadata'->>'kvkk_consent')::boolean, false),
        true
    )
    on conflict (id) do update
    set
        email = coalesce(excluded.email, public.users.email),
        full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name),
        role = case
            when lower(excluded.email) = 'dilarakaraca550@gmail.com' then 'admin'
            else public.users.role
        end,
        updated_at = now()
    returning * into profile;

    return profile;
end;
$$;

grant execute on function public.ensure_own_profile() to authenticated;

-- 6) Profil okuma
create or replace function public.get_own_profile()
returns public.users
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    profile public.users;
begin
    perform set_config('row_security', 'off', true);
    select * into profile from public.users where id = auth.uid() limit 1;
    return profile;
end;
$$;

grant execute on function public.get_own_profile() to authenticated;

-- 7) Admin kullanıcı listesi
create or replace function public.get_admin_users()
returns setof public.users
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    perform set_config('row_security', 'off', true);

    if not exists (
        select 1 from public.users
        where id = auth.uid() and role = 'admin'
    ) then
        return;
    end if;

    return query
        select * from public.users
        order by created_at desc;
end;
$$;

grant execute on function public.get_admin_users() to authenticated;

-- 8) Admin kullanıcı + görev istatistikleri
create or replace function public.get_admin_users_with_stats()
returns table (
    id uuid,
    full_name text,
    email text,
    role text,
    active boolean,
    email_confirmed boolean,
    kvkk_consent boolean,
    kvkk_consent_at timestamptz,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    task_count bigint,
    completed_task_count bigint,
    last_task_date date
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    perform set_config('row_security', 'off', true);

    if not exists (
        select 1 from public.users
        where id = auth.uid() and role = 'admin'
    ) then
        return;
    end if;

    return query
        select
            u.id, u.full_name, u.email, u.role, u.active, u.email_confirmed,
            u.kvkk_consent, u.kvkk_consent_at, u.last_sign_in_at, u.created_at, u.updated_at,
            coalesce(count(t.id), 0)::bigint,
            coalesce(count(t.id) filter (where t.completed), 0)::bigint,
            max(t.date)
        from public.users u
        left join public.tasks t on t.user_id = u.id
        group by u.id
        order by u.last_sign_in_at desc nulls last, u.created_at desc;
end;
$$;

grant execute on function public.get_admin_users_with_stats() to authenticated;

-- 9) Admin: başka kullanıcının görevlerini oku
create or replace function public.get_admin_user_tasks(p_user_id uuid)
returns setof public.tasks
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    perform set_config('row_security', 'off', true);

    if not exists (
        select 1 from public.users
        where id = auth.uid() and role = 'admin'
    ) then
        return;
    end if;

    return query
        select * from public.tasks
        where user_id = p_user_id
        order by date desc, created_at desc;
end;
$$;

grant execute on function public.get_admin_user_tasks(uuid) to authenticated;

-- 10) Rol yükseltmesini engelle (sadece security definer / admin / bootstrap)
create or replace function public.guard_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.role is not distinct from old.role then
        return new;
    end if;

    -- SQL Editor / service_role (JWT yok)
    if auth.uid() is null then
        return new;
    end if;

    perform set_config('row_security', 'off', true);

    -- Bootstrap admin kendi kaydını admin yapabilir
    if lower(coalesce(new.email, '')) = 'dilarakaraca550@gmail.com'
       and new.role = 'admin'
       and new.id = auth.uid() then
        return new;
    end if;

    -- Mevcut adminler rol değiştirebilir
    if exists (
        select 1 from public.users
        where id = auth.uid() and role = 'admin'
    ) then
        return new;
    end if;

    -- Aksi halde rolü eski değerde tut
    new.role := old.role;
    return new;
end;
$$;

drop trigger if exists trg_guard_user_role_change on public.users;
create trigger trg_guard_user_role_change
before update of role on public.users
for each row
execute function public.guard_user_role_change();

-- DOĞRULAMA (ayrı çalıştır):
-- select id, email, role, active from public.users where lower(email) = 'dilarakaraca550@gmail.com';
-- select count(*) as user_count from public.users;
