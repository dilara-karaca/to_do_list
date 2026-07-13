-- Görev kalıcılığı düzeltmeleri (JWT tabanlı, auth.users okumaz)
-- Supabase SQL Editor'da bir kez çalıştır.

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
        'user',
        coalesce((auth.jwt()->>'email_confirmed')::boolean, false),
        coalesce((auth.jwt()->'user_metadata'->>'kvkk_consent')::boolean, false),
        true
    )
    on conflict (id) do update
    set
        email = coalesce(excluded.email, public.users.email),
        full_name = coalesce(public.users.full_name, excluded.full_name),
        updated_at = now()
    returning * into profile;

    return profile;
end;
$$;

grant execute on function public.ensure_own_profile() to authenticated;

create or replace function public.get_own_tasks()
returns setof public.tasks
language sql
security definer
set search_path = public
stable
as $$
    select *
    from public.tasks
    where user_id = auth.uid()
    order by date desc;
$$;

grant execute on function public.get_own_tasks() to authenticated;

create or replace function public.upsert_own_task(
    p_id uuid,
    p_title text,
    p_description text,
    p_date date,
    p_completed boolean,
    p_created_at timestamptz default now(),
    p_series_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.ensure_own_profile();

    insert into public.tasks (
        id,
        user_id,
        title,
        description,
        date,
        completed,
        created_at,
        series_id
    )
    values (
        p_id,
        auth.uid(),
        p_title,
        p_description,
        p_date,
        p_completed,
        coalesce(p_created_at, now()),
        p_series_id
    )
    on conflict (id) do update
    set
        title = excluded.title,
        description = excluded.description,
        date = excluded.date,
        completed = excluded.completed,
        series_id = excluded.series_id,
        updated_at = now();

    return p_id;
end;
$$;

grant execute on function public.upsert_own_task(uuid, text, text, date, boolean, timestamptz, uuid) to authenticated;

create or replace function public.delete_own_task(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.tasks
    where id = p_id
      and user_id = auth.uid();
end;
$$;

grant execute on function public.delete_own_task(uuid) to authenticated;

create or replace function public.delete_own_task_series(p_series_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_series_id is null then
        return;
    end if;

    delete from public.tasks
    where series_id = p_series_id
      and user_id = auth.uid();
end;
$$;

grant execute on function public.delete_own_task_series(uuid) to authenticated;

-- Tablolar yoksa oluştur
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text,
    date date not null,
    completed boolean not null default false,
    series_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists series_id uuid;

alter table public.tasks enable row level security;

drop policy if exists "users can read own tasks" on public.tasks;
create policy "users can read own tasks"
    on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "users can insert own tasks" on public.tasks;
create policy "users can insert own tasks"
    on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own tasks" on public.tasks;
create policy "users can update own tasks"
    on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can delete own tasks" on public.tasks;
create policy "users can delete own tasks"
    on public.tasks for delete using (auth.uid() = user_id);

drop policy if exists "admins can read all tasks" on public.tasks;
create policy "admins can read all tasks"
    on public.tasks for select using (public.is_admin());
