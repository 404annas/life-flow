-- Add explicit onboarding completion flag
alter table public.profiles
add column if not exists onboarding_completed boolean default false;

-- Backfill existing users as completed when core onboarding fields are present
update public.profiles
set onboarding_completed = true
where coalesce(trim(full_name), '') <> ''
  and daily_goal is not null
  and coalesce(trim(accent_color), '') <> '';

-- Fix RLS policy recursion on profiles (causes "infinite recursion detected in policy")
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles;', p.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create policy "users_select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins_select_all_profiles"
  on public.profiles for select
  using (public.is_current_user_admin());

create policy "users_update_own_profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
