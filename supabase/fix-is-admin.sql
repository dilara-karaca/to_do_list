-- RLS sonsuz döngüsünü düzeltir (520 / CORS hatasının ana nedeni)
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
