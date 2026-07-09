-- Admin panel düzeltmeleri ve ek RPC'ler
-- Supabase SQL Editor'da bir kez çalıştır.

-- 1) auth.users -> public.users son giriş senkronu
create or replace function public.sync_auth_sign_in_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.users
    set
        last_sign_in_at = new.last_sign_in_at,
        email_confirmed = (new.email_confirmed_at is not null),
        updated_at = now()
    where id = new.id;

    return new;
end;
$$;

drop trigger if exists on_auth_user_sign_in on auth.users;
create trigger on_auth_user_sign_in
after update of last_sign_in_at on auth.users
for each row
when (old.last_sign_in_at is distinct from new.last_sign_in_at)
execute function public.sync_auth_sign_in_to_profile();

-- Mevcut kullanıcılar için geri doldurma
update public.users u
set last_sign_in_at = au.last_sign_in_at
from auth.users au
where u.id = au.id
  and au.last_sign_in_at is not null
  and (u.last_sign_in_at is null or u.last_sign_in_at < au.last_sign_in_at);

-- 2) auth.users'da olup public.users'da olmayan profilleri oluştur
insert into public.users (
    id,
    full_name,
    email,
    role,
    email_confirmed,
    kvkk_consent,
    kvkk_consent_at,
    active,
    last_sign_in_at
)
select
    au.id,
    coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.email,
    case when lower(au.email) = 'dilarakaraca550@gmail.com' then 'admin' else 'user' end,
    au.email_confirmed_at is not null,
    coalesce((au.raw_user_meta_data->>'kvkk_consent')::boolean, false),
    case
        when coalesce((au.raw_user_meta_data->>'kvkk_consent')::boolean, false) then now()
        else null
    end,
    true,
    au.last_sign_in_at
from auth.users au
where not exists (
    select 1 from public.users pu where pu.id = au.id
)
on conflict (id) do nothing;

-- 3) Ana admin hesabını garanti et
update public.users
set role = 'admin', active = true
where lower(email) = 'dilarakaraca550@gmail.com';

-- 4) Admin: kullanıcı görevlerini oku
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
        select *
        from public.tasks
        where user_id = p_user_id
        order by date desc, created_at desc;
end;
$$;

grant execute on function public.get_admin_user_tasks(uuid) to authenticated;

-- 5) Admin: kullanıcı listesi + görev istatistikleri
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
            u.id,
            u.full_name,
            u.email,
            u.role,
            u.active,
            u.email_confirmed,
            u.kvkk_consent,
            u.kvkk_consent_at,
            u.last_sign_in_at,
            u.created_at,
            u.updated_at,
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

-- 6) ensure_own_profile: mevcut admin rolünü koru
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
begin
    if user_id is null then
        raise exception 'not authenticated';
    end if;

    perform set_config('row_security', 'off', true);

    select * into profile from public.users where id = user_id;
    if found then
        return profile;
    end if;

    insert into public.users (
        id,
        full_name,
        email,
        role,
        email_confirmed,
        kvkk_consent,
        active
    )
    values (
        user_id,
        user_name,
        coalesce(nullif(user_email, ''), user_id::text || '@users.local'),
        case when lower(user_email) = 'dilarakaraca550@gmail.com' then 'admin' else 'user' end,
        coalesce((auth.jwt()->>'email_confirmed')::boolean, false),
        coalesce((auth.jwt()->'user_metadata'->>'kvkk_consent')::boolean, false),
        true
    )
    on conflict (id) do update
    set
        email = coalesce(excluded.email, public.users.email),
        full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name),
        role = public.users.role,
        updated_at = now()
    returning * into profile;

    return profile;
end;
$$;

grant execute on function public.ensure_own_profile() to authenticated;
