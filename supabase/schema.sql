create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role text not null default 'user' check (role in ('user', 'admin')),
    active boolean not null default true,
    email_confirmed boolean not null default false,
    kvkk_consent boolean not null default false,
    kvkk_consent_at timestamptz,
    last_sign_in_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.users add column if not exists active boolean not null default true;
alter table public.users add column if not exists email_confirmed boolean not null default false;
alter table public.users add column if not exists kvkk_consent boolean not null default false;
alter table public.users add column if not exists kvkk_consent_at timestamptz;
alter table public.users add column if not exists last_sign_in_at timestamptz;

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text,
    date date not null,
    completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.users(id) on delete set null,
    action text not null,
    entity_type text,
    entity_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_logs enable row level security;

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
        select 1
        from public.users
        where id = auth.uid()
          and role = 'admin'
    );
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

create or replace function public.get_own_profile()
returns public.users
language sql
security definer
set search_path = public
stable
as $$
    select *
    from public.users
    where id = auth.uid()
    limit 1;
$$;

grant execute on function public.get_own_profile() to authenticated;

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
        select 1
        from public.users
        where id = auth.uid()
          and role = 'admin'
    ) then
        return;
    end if;

    return query
        select *
        from public.users
        order by created_at desc;
end;
$$;

grant execute on function public.get_admin_users() to authenticated;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
    on public.users
    for select
    using (auth.uid() = id);

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
    on public.users
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile"
    on public.users
    for insert
    with check (auth.uid() = id);

drop policy if exists "admins can read all users" on public.users;
create policy "admins can read all users"
    on public.users
    for select
    using (public.is_admin());

drop policy if exists "admins can update all users" on public.users;
create policy "admins can update all users"
    on public.users
    for update
    using (public.is_admin());

drop policy if exists "users can read own tasks" on public.tasks;
create policy "users can read own tasks"
    on public.tasks
    for select
    using (auth.uid() = user_id);

drop policy if exists "users can insert own tasks" on public.tasks;
create policy "users can insert own tasks"
    on public.tasks
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "users can update own tasks" on public.tasks;
create policy "users can update own tasks"
    on public.tasks
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "users can delete own tasks" on public.tasks;
create policy "users can delete own tasks"
    on public.tasks
    for delete
    using (auth.uid() = user_id);

drop policy if exists "admins can read all tasks" on public.tasks;
create policy "admins can read all tasks"
    on public.tasks
    for select
    using (public.is_admin());

drop policy if exists "admins can read activity logs" on public.activity_logs;
create policy "admins can read activity logs"
    on public.activity_logs
    for select
    using (public.is_admin());

drop policy if exists "authenticated can insert activity logs" on public.activity_logs;
create policy "authenticated can insert activity logs"
    on public.activity_logs
    for insert
    with check (auth.uid() is not null);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at
before update on public.users
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_tasks_updated_at on public.tasks;
create trigger touch_tasks_updated_at
before update on public.tasks
for each row
execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (
        id,
        full_name,
        email,
        role,
        email_confirmed,
        kvkk_consent,
        kvkk_consent_at
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        'user',
        new.email_confirmed_at is not null,
        coalesce((new.raw_user_meta_data->>'kvkk_consent')::boolean, false),
        case
            when coalesce((new.raw_user_meta_data->>'kvkk_consent')::boolean, false) then now()
            else null
        end
    )
    on conflict (id) do update
    set
        full_name = excluded.full_name,
        email = excluded.email,
        email_confirmed = excluded.email_confirmed,
        kvkk_consent = excluded.kvkk_consent,
        kvkk_consent_at = excluded.kvkk_consent_at,
        updated_at = now();

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatar images are publicly accessible" on storage.objects;
create policy "avatar images are publicly accessible"
    on storage.objects
    for select
    using (bucket_id = 'avatars');

drop policy if exists "users can upload own avatar" on storage.objects;
create policy "users can upload own avatar"
    on storage.objects
    for insert
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "users can update own avatar" on storage.objects;
create policy "users can update own avatar"
    on storage.objects
    for update
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "users can delete own avatar" on storage.objects;
create policy "users can delete own avatar"
    on storage.objects
    for delete
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
