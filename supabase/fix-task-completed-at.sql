-- Tamamlanma saati desteği
-- Supabase SQL Editor'da bir kez çalıştır (uzak DB'de migration zaten uygulandıysa gerekmez).

alter table public.tasks
    add column if not exists completed_at timestamptz;

update public.tasks
set completed_at = coalesce(updated_at, created_at)
where completed = true
  and completed_at is null;

drop function if exists public.upsert_own_task(uuid, text, text, date, boolean, timestamptz, uuid);

create or replace function public.upsert_own_task(
    p_id uuid,
    p_title text,
    p_description text,
    p_date date,
    p_completed boolean,
    p_created_at timestamptz default now(),
    p_series_id uuid default null,
    p_completed_at timestamptz default null
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
        series_id,
        completed_at
    )
    values (
        p_id,
        auth.uid(),
        p_title,
        p_description,
        p_date,
        p_completed,
        coalesce(p_created_at, now()),
        p_series_id,
        case when p_completed then p_completed_at else null end
    )
    on conflict (id) do update
    set
        title = excluded.title,
        description = excluded.description,
        date = excluded.date,
        completed = excluded.completed,
        series_id = excluded.series_id,
        completed_at = case
            when excluded.completed then coalesce(excluded.completed_at, public.tasks.completed_at, now())
            else null
        end,
        updated_at = now();

    return p_id;
end;
$$;

grant execute on function public.upsert_own_task(uuid, text, text, date, boolean, timestamptz, uuid, timestamptz) to authenticated;
