-- Görev kalıcılığı düzeltmeleri
-- Supabase SQL Editor'da bir kez çalıştır.

create or replace function public.ensure_own_profile()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
    auth_user record;
    profile public.users;
begin
    select id, email, email_confirmed_at, raw_user_meta_data
    into auth_user
    from auth.users
    where id = auth.uid();

    if auth_user.id is null then
        raise exception 'not authenticated';
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
        auth_user.id,
        coalesce(auth_user.raw_user_meta_data->>'full_name', split_part(auth_user.email, '@', 1)),
        auth_user.email,
        'user',
        auth_user.email_confirmed_at is not null,
        coalesce((auth_user.raw_user_meta_data->>'kvkk_consent')::boolean, false),
        true
    )
    on conflict (id) do update
    set
        email = excluded.email,
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
    p_created_at timestamptz default now()
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
        created_at
    )
    values (
        p_id,
        auth.uid(),
        p_title,
        p_description,
        p_date,
        p_completed,
        coalesce(p_created_at, now())
    )
    on conflict (id) do update
    set
        title = excluded.title,
        description = excluded.description,
        date = excluded.date,
        completed = excluded.completed,
        updated_at = now();

    return p_id;
end;
$$;

grant execute on function public.upsert_own_task(uuid, text, text, date, boolean, timestamptz) to authenticated;

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
