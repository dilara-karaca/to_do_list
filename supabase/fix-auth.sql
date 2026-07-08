-- Auth düzeltmeleri: RLS döngüsü + profil okuma
-- Supabase SQL Editor'da bir kez çalıştır.

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
