-- Tekrarlayan görev serisi desteği
-- Supabase SQL Editor'da bir kez çalıştır (uzak DB'de migration zaten uygulandıysa gerekmez).

alter table public.tasks
    add column if not exists series_id uuid;

create index if not exists tasks_series_id_idx
    on public.tasks (user_id, series_id)
    where series_id is not null;

drop function if exists public.upsert_own_task(uuid, text, text, date, boolean, timestamptz);

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
