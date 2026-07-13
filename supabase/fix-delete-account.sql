-- Hesap ve verileri tamamen silme
-- Supabase SQL Editor'da bir kez çalıştır.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
begin
    if uid is null then
        raise exception 'not authenticated';
    end if;

    perform set_config('row_security', 'off', true);

    delete from storage.objects
    where bucket_id = 'avatars'
      and name like uid::text || '/%';

    delete from public.activity_logs where actor_id = uid;
    delete from public.tasks where user_id = uid;
    delete from public.users where id = uid;
    delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
