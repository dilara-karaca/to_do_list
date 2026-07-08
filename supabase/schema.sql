create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

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

create policy "users can read own profile"
    on public.users
    for select
    using (auth.uid() = id);

create policy "users can update own profile"
    on public.users
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "admins can read all users"
    on public.users
    for select
    using (exists (select 1 from public.users me where me.id = auth.uid() and me.role = 'admin'));

create policy "admins can update all users"
    on public.users
    for update
    using (exists (select 1 from public.users me where me.id = auth.uid() and me.role = 'admin'));

create policy "users can read own tasks"
    on public.tasks
    for select
    using (auth.uid() = user_id);

create policy "users can insert own tasks"
    on public.tasks
    for insert
    with check (auth.uid() = user_id);

create policy "users can update own tasks"
    on public.tasks
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "users can delete own tasks"
    on public.tasks
    for delete
    using (auth.uid() = user_id);

create policy "admins can read activity logs"
    on public.activity_logs
    for select
    using (exists (select 1 from public.users me where me.id = auth.uid() and me.role = 'admin'));

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

insert into public.activity_logs (action, metadata)
values ('schema_initialized', jsonb_build_object('source', 'schema.sql'))
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "avatar images are publicly accessible"
    on storage.objects
    for select
    using (bucket_id = 'avatars');

create policy "users can upload own avatar"
    on storage.objects
    for insert
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "users can update own avatar"
    on storage.objects
    for update
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "users can delete own avatar"
    on storage.objects
    for delete
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
