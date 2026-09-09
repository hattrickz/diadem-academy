-- ============================================================================
-- Migration: init_roles_and_profiles
-- Phase 2 — Supabase backend foundation for Diadem Consult Academy
-- ============================================================================
-- Scope of this migration (intentionally minimal — Phase 2 only):
--   1. A `user_role` enum (student, tutor, admin — super_admin can be added
--      later with `ALTER TYPE ... ADD VALUE`, which is backward compatible).
--   2. A `profiles` table that mirrors/extends `auth.users`, keyed 1:1 by
--      the Supabase Auth user id.
--   3. A trigger that auto-creates a profile row (role = 'student') whenever
--      a new user signs up via Supabase Auth.
--   4. A trigger that blocks any direct client-side change to `role`,
--      forcing role changes through privileged, server-side (service-role)
--      code — this is what stops a student from promoting themselves.
--   5. Row Level Security policies enforcing:
--        - a user can read and update their own profile (but not its role)
--        - an admin can read every profile
--        - everyone/everything else is denied by default (RLS default-deny)
--
-- Deliberately NOT created here (future phases): courses, modules, lessons,
-- enrollments, quizzes, assignments, payments, certificates, attendance,
-- notifications, blog tables. Those will all use `profiles.id` as their
-- foreign-key anchor back to a user, so this table is the stable core the
-- rest of the schema builds on without requiring a rewrite.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ROLE ENUM
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'tutor', 'admin');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. UPDATED_AT HELPER (reusable by every future table)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. PROFILES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  -- Denormalized copy of auth.users.email for convenient reads/joins.
  -- The source of truth for authentication remains auth.users; this column
  -- is populated at signup and is not required to be kept in perfect sync.
  email       text,
  phone       text,
  avatar_url  text,
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Application-level profile for every Supabase Auth user. 1:1 with auth.users. '
  'This is the foreign-key anchor every future table (courses, enrollments, '
  'payments, etc.) should reference via profiles.id.';

comment on column public.profiles.role is
  'Authorization role. Changing this column directly is blocked for normal '
  'clients by the prevent_role_change trigger — role changes must go through '
  'server-side code using the Supabase service-role key.';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. AUTO-CREATE A PROFILE WHEN A NEW AUTH USER SIGNS UP
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so it can insert into public.profiles regardless of RLS —
-- this is the one legitimate, controlled path that creates a profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. BLOCK CLIENT-SIDE ROLE ESCALATION
-- ----------------------------------------------------------------------------
-- RLS policies alone cannot restrict which *columns* an authorized UPDATE
-- may touch. This trigger closes that gap: any change to `role` is rejected
-- unless it is performed with the service-role key (used only in trusted,
-- server-side code — never in the browser).
create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception
      'Changing role directly is not permitted. Role changes must be performed by an administrator through a trusted server-side process.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_self_update on public.profiles;
create trigger prevent_role_self_update
  before update on public.profiles
  for each row
  execute function public.prevent_role_self_update();

-- ----------------------------------------------------------------------------
-- 6. ROLE-LOOKUP HELPER FOR RLS POLICIES
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER + a fixed search_path lets policies check "is this caller
-- an admin?" without the recursive-RLS problem of a policy on `profiles`
-- querying `profiles` directly.
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Deny-by-default: no policy below grants INSERT or DELETE to normal
-- clients, so both remain blocked unless done via the service-role key
-- (which bypasses RLS) from trusted server-side code.

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.current_user_role() = 'admin');

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
  -- Note: this policy permits a user to UPDATE their own row; the separate
  -- prevent_role_self_update trigger is what stops them changing `role`
  -- within that same UPDATE.

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles
  for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
  -- Admin role changes to OTHER users still go through the service-role key
  -- server-side in this phase; this policy exists so a future admin UI can
  -- let admins edit non-role fields (e.g. full_name) directly if desired.
