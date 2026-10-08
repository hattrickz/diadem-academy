-- ============================================================================
-- Migration: courses_lessons_enrollments
-- Phase 5 — Course / LMS foundation for Diadem Consult Academy
-- ============================================================================
-- Scope (intentionally minimal):
--   1. public.courses      — the course catalog
--   2. public.lessons      — ordered lessons belonging to a course
--   3. public.enrollments  — which student is enrolled in which course
--   4. Row Level Security for all three, built on the existing
--      public.current_user_role() helper and auth.uid().
--
-- Deliberately NOT created here (later phases): progress tracking, payments,
-- quizzes, assignments, certificates, attendance, notifications, storage
-- buckets / uploads. video_url and pdf_url are plain URLs used as
-- placeholders for a future media/storage integration.
--
-- This migration does not touch public.profiles, its policies, its triggers,
-- or any existing function.
--
-- ACCESS MODEL (summary)
--   courses      anyone (incl. anonymous) can read PUBLISHED courses;
--                tutors/admins can read all and create/update; only admins
--                can delete (deleting cascades to lessons + enrollments).
--   lessons      NEVER readable anonymously (they hold the course media).
--                A student can read a lesson only if the lesson is published
--                AND they are enrolled in its course AND that course is
--                published. Tutors/admins can read and write all lessons.
--   enrollments  a student can read ONLY their own rows and can never write.
--                Admins can read and write all. There is intentionally no
--                student self-enrollment path until payments/enrollment
--                verification exists (a later phase).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COURSES
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null,
  description   text,
  thumbnail_url text,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint courses_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint courses_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  constraint courses_description_length
    check (description is null or char_length(description) <= 5000),
  -- https only, and no embedded credentials (https://user:pass@host/):
  -- these values end up in <img src>, so reject javascript:, data:,
  -- plain-http (mixed content) and userinfo URLs at the source. The
  -- authority part may not contain '@'; '@' is still fine in a path/query.
  constraint courses_thumbnail_url_https
    check (
      thumbnail_url is null
      or (thumbnail_url ~* '^https://[^/?#@[:space:]]+([/?#][^[:space:]]*)?$' and char_length(thumbnail_url) <= 2048)
    )
);

comment on table public.courses is
  'Course catalog. Anyone may read rows where published = true; writes are '
  'restricted to tutors/admins by RLS.';

create unique index if not exists courses_slug_key on public.courses (slug);
create index if not exists courses_published_idx on public.courses (published);

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
  before update on public.courses
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. LESSONS
-- ----------------------------------------------------------------------------
create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  title       text not null,
  description text,
  video_url   text,
  pdf_url     text,
  -- Display order within the course (ascending). Deliberately NOT unique so
  -- an author can reorder lessons without transient constraint violations;
  -- ties are broken by created_at when listing.
  position    integer not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint lessons_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint lessons_description_length
    check (description is null or char_length(description) <= 10000),
  constraint lessons_position_non_negative
    check (position >= 0),
  -- https only, and no embedded credentials (https://user:pass@host/):
  -- these values are rendered as links / embeds.
  constraint lessons_video_url_https
    check (
      video_url is null
      or (video_url ~* '^https://[^/?#@[:space:]]+([/?#][^[:space:]]*)?$' and char_length(video_url) <= 2048)
    ),
  constraint lessons_pdf_url_https
    check (
      pdf_url is null
      or (pdf_url ~* '^https://[^/?#@[:space:]]+([/?#][^[:space:]]*)?$' and char_length(pdf_url) <= 2048)
    )
);

comment on table public.lessons is
  'Lessons belonging to a course. Readable only by enrolled students '
  '(published lessons of published courses) and tutors/admins.';

create index if not exists lessons_course_position_idx
  on public.lessons (course_id, position);

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at
  before update on public.lessons
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. ENROLLMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  course_id   uuid not null references public.courses (id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint enrollments_student_course_key unique (student_id, course_id)
);

comment on table public.enrollments is
  'Which student is enrolled in which course. Students can only read their '
  'own rows; creation is admin/server-side only until payments exist.';

create index if not exists enrollments_course_id_idx
  on public.enrollments (course_id);

-- ----------------------------------------------------------------------------
-- 4. ENROLLMENT HELPER FOR RLS
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER + fixed search_path (same pattern as current_user_role())
-- so the lessons policy can ask "is the caller enrolled in this published
-- course?" without depending on the caller's RLS visibility of the other
-- tables. It only ever answers about auth.uid() — it cannot be used to probe
-- other people's enrollments.
create or replace function public.is_enrolled_in_published_course(p_course_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.course_id = p_course_id
      and e.student_id = auth.uid()
      and c.published = true
  );
$$;

-- Postgres grants EXECUTE to PUBLIC by default; restrict to signed-in users.
revoke all on function public.is_enrolled_in_published_course(uuid) from public;
revoke all on function public.is_enrolled_in_published_course(uuid) from anon;
grant execute on function public.is_enrolled_in_published_course(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. PRIVILEGES (explicit and minimal — the layer UNDER row level security)
-- ----------------------------------------------------------------------------
-- RLS policies only decide WHICH ROWS a role may touch; the role must still
-- hold SQL table privileges, and some privileges (TRUNCATE in particular)
-- are not subject to RLS at all.
--
-- Phase 2 granted nothing explicitly and relied on Supabase's default
-- privileges, which hand ALL privileges on every new public table to anon,
-- authenticated and service_role — including TRUNCATE, REFERENCES and
-- TRIGGER. So here we first strip whatever the defaults handed out, then
-- grant exactly what the policies below need. The result is identical on a
-- project WITH default grants and on one WITHOUT them.
--
-- service_role is intentionally not touched (server-side only; it bypasses
-- RLS and is never used by the student/public pages).
revoke all on public.courses     from anon, authenticated;
revoke all on public.lessons     from anon, authenticated;
revoke all on public.enrollments from anon, authenticated;

-- Anonymous visitors: read courses only (RLS then limits that to published
-- rows). Nothing at all on lessons or enrollments.
grant select on public.courses to anon;

-- Signed-in users. Students, tutors and admins all connect as the single
-- `authenticated` database role, so table privileges cannot tell them apart —
-- the RLS policies below do. A student holding INSERT/UPDATE/DELETE here is
-- still denied by RLS (no student write policy exists on any of these
-- tables); the write privileges are what let the tutor/admin policies work.
grant select, insert, update, delete on public.courses     to authenticated;
grant select, insert, update, delete on public.lessons     to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.courses     enable row level security;
alter table public.lessons     enable row level security;
alter table public.enrollments enable row level security;

-- Role checks use (select ...) so Postgres evaluates the helper once per
-- statement instead of once per row.

-- ---- courses ---------------------------------------------------------------
drop policy if exists "Anyone can view published courses" on public.courses;
create policy "Anyone can view published courses"
  on public.courses
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Tutors and admins can view all courses" on public.courses;
create policy "Tutors and admins can view all courses"
  on public.courses
  for select
  to authenticated
  using ((select public.current_user_role()) in ('tutor', 'admin'));

drop policy if exists "Tutors and admins can create courses" on public.courses;
create policy "Tutors and admins can create courses"
  on public.courses
  for insert
  to authenticated
  with check ((select public.current_user_role()) in ('tutor', 'admin'));

drop policy if exists "Tutors and admins can update courses" on public.courses;
create policy "Tutors and admins can update courses"
  on public.courses
  for update
  to authenticated
  using ((select public.current_user_role()) in ('tutor', 'admin'))
  with check ((select public.current_user_role()) in ('tutor', 'admin'));

-- Deleting a course cascades to its lessons and enrollments, so only admins.
drop policy if exists "Admins can delete courses" on public.courses;
create policy "Admins can delete courses"
  on public.courses
  for delete
  to authenticated
  using ((select public.current_user_role()) = 'admin');

-- ---- lessons ---------------------------------------------------------------
drop policy if exists "Enrolled students can view published lessons" on public.lessons;
create policy "Enrolled students can view published lessons"
  on public.lessons
  for select
  to authenticated
  using (
    published = true
    and public.is_enrolled_in_published_course(course_id)
  );

drop policy if exists "Tutors and admins can view all lessons" on public.lessons;
create policy "Tutors and admins can view all lessons"
  on public.lessons
  for select
  to authenticated
  using ((select public.current_user_role()) in ('tutor', 'admin'));

drop policy if exists "Tutors and admins can create lessons" on public.lessons;
create policy "Tutors and admins can create lessons"
  on public.lessons
  for insert
  to authenticated
  with check ((select public.current_user_role()) in ('tutor', 'admin'));

drop policy if exists "Tutors and admins can update lessons" on public.lessons;
create policy "Tutors and admins can update lessons"
  on public.lessons
  for update
  to authenticated
  using ((select public.current_user_role()) in ('tutor', 'admin'))
  with check ((select public.current_user_role()) in ('tutor', 'admin'));

drop policy if exists "Tutors and admins can delete lessons" on public.lessons;
create policy "Tutors and admins can delete lessons"
  on public.lessons
  for delete
  to authenticated
  using ((select public.current_user_role()) in ('tutor', 'admin'));

-- ---- enrollments -----------------------------------------------------------
-- No INSERT/UPDATE/DELETE policy exists for students, so RLS default-deny
-- blocks every student write. Only the two policies below grant anything.
drop policy if exists "Students can view their own enrollments" on public.enrollments;
create policy "Students can view their own enrollments"
  on public.enrollments
  for select
  to authenticated
  using (student_id = (select auth.uid()));

drop policy if exists "Admins can manage all enrollments" on public.enrollments;
create policy "Admins can manage all enrollments"
  on public.enrollments
  for all
  to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

-- Future note: tutor access to the enrollments of courses they teach, and
-- per-tutor course ownership, can be added later as ADDITIVE policies (plus
-- an owner column) without changing any policy above.
