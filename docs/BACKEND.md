# Backend Documentation — Phase 2 (Supabase Foundation)

This document explains the Supabase backend foundation added in Phase 2.
It intentionally covers **only** what exists right now: authentication
identity + role-based profiles. Courses, enrollments, quizzes, payments,
etc. are future phases and are not implemented yet.

---

## 1. Required environment variables

Copy `.env.local.example` to `.env.local` and fill in real values from your
Supabase project (**Project Settings → API**):

| Variable | Exposed to browser? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your project's API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key — safe client-side, access is scoped by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **No — server only** | Bypasses RLS entirely. Only read in `lib/supabase/admin.ts`, which is protected by the `server-only` package so it cannot be imported into a Client Component/browser bundle. |

`.env.local` is git-ignored (see `.gitignore`). Never commit real values.
`.env.local.example` contains no secrets and is safe to commit.

**No live project has been provisioned or linked yet** — see §7.

---

## 2. How the Next.js app talks to Supabase

Three separate helpers, for three separate trust levels:

- `lib/supabase/client.ts` — browser client (Client Components). Uses only
  the public URL + anon key.
- `lib/supabase/server.ts` — server client (Server Components, Route
  Handlers, Server Actions). Same public credentials, but reads the
  session from cookies so RLS policies see the signed-in user.
- `lib/supabase/admin.ts` — privileged client using the service-role key.
  Bypasses RLS. Guarded by `import "server-only"` at the top of the file,
  so Next.js will fail the build if it's ever imported into client code.
  Not imported anywhere yet in Phase 2 — it exists for future admin-only
  server actions (e.g. changing a user's role).

`middleware.ts` refreshes the Supabase session cookie on every request. It
does **not** gate any route yet (no `/student`, `/tutor`, `/admin` routes
exist). If the env vars are absent, it safely no-ops rather than breaking
the public site — this was tested with the production build running and
no Supabase env vars set; all public routes still returned `200`.

None of the existing public pages (`/`, `/about`, `/programs`, `/contact`)
or their components were converted to Client Components for this. They
remain server-rendered exactly as before.

---

## 3. Database schema created in this phase

One migration: `supabase/migrations/20260905024107_init_roles_and_profiles.sql`

### `public.user_role` (enum)
```
'student' | 'tutor' | 'admin'
```
A `super_admin` value can be added later with a backward-compatible
`ALTER TYPE public.user_role ADD VALUE 'super_admin';` migration — no
rebuild required.

### `public.profiles`
1:1 with `auth.users`, and the anchor every future table (courses,
enrollments, payments, etc.) should have a foreign key to.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `references auth.users(id) on delete cascade` |
| `full_name` | `text` | nullable |
| `email` | `text` | denormalized copy of `auth.users.email`, set at signup |
| `phone` | `text` | nullable |
| `avatar_url` | `text` | nullable |
| `role` | `user_role` | `not null default 'student'` |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()`, kept fresh by trigger |

Indexes: `profiles_role_idx (role)`, `profiles_email_idx (email)`.

### Functions / triggers
- `set_updated_at()` — generic `updated_at` refresher, reusable by every
  future table.
- `handle_new_user()` — `SECURITY DEFINER`, fires `AFTER INSERT ON
  auth.users`. Creates the matching `profiles` row with `role = 'student'`
  always — the signup flow has no way to request `tutor` or `admin`.
- `prevent_role_self_update()` — fires `BEFORE UPDATE ON profiles`. If
  `role` is being changed and the caller is not `service_role`, the update
  is rejected with an exception. This is what stops a student from
  granting themselves `admin`/`tutor` via a normal authenticated request,
  even though the "update own profile" RLS policy otherwise allows them to
  update their own row.
- `current_user_role()` — `SECURITY DEFINER` helper so RLS policies can
  check "is the caller an admin?" without a self-referencing/recursive
  policy on `profiles`.

### Row Level Security
RLS is **enabled** on `profiles`. Four policies, default-deny otherwise
(no `INSERT`/`DELETE` policy exists for normal clients — both are blocked
unless done via the service-role key from trusted server code):

| Policy | Command | Rule |
|---|---|---|
| Users can view their own profile | SELECT | `auth.uid() = id` |
| Admins can view all profiles | SELECT | `current_user_role() = 'admin'` |
| Users can update their own profile | UPDATE | `auth.uid() = id` (role changes separately blocked by trigger) |
| Admins can update all profiles | UPDATE | `current_user_role() = 'admin'` |

---

## 4. Role architecture summary

- **Signup** (`auth.users` insert) → trigger auto-creates a `profiles` row
  with `role = 'student'`. There is no code path in Phase 2 that lets a
  new signup choose their own role.
- **Self-escalation is blocked** at the database level, not just in the
  UI: any client-side attempt to change `role` (student → tutor/admin,
  or vice versa) is rejected by the `prevent_role_self_update` trigger
  regardless of what the frontend sends.
- **Legitimate role changes** (e.g. an admin promoting a tutor) must go
  through server-side code using `lib/supabase/admin.ts` (the
  service-role client, which bypasses RLS and is exempt from the trigger's
  block). No such admin UI/action exists yet — building it is a later
  phase; the foundation is what's being verified here.

---

## 5. Verification performed

Because this sandbox's network egress does not allow `supabase.com` /
`*.supabase.co` (confirmed directly — see §7), the migration was validated
against a local, temporary PostgreSQL 16 instance with a minimal stub of
Supabase's `auth` schema (`auth.users`, `auth.uid()`, `auth.role()`). This
validates the SQL and trigger/RLS *logic* precisely, but is **not** a
substitute for applying it to a real Supabase project.

Confirmed locally:
- Migration applies cleanly, only expected `DROP ... IF EXISTS` notices.
- Inserting into `auth.users` automatically creates a matching `profiles`
  row with `role = 'student'`.
- Updating `role` while simulating an `authenticated` (non-service-role)
  caller is **rejected** with the expected exception; the row's role is
  confirmed unchanged afterward.
- Updating `role` while simulating `service_role` **succeeds** — proving
  the trigger discriminates correctly rather than blocking everything.
- `pg_policies` shows exactly the 4 expected policies on `profiles`.
- `relrowsecurity = true` for `profiles`.
- All 3 triggers and both indexes exist as designed.
- `enum_range` confirms `{student, tutor, admin}`.

Also confirmed with the production Next.js build running (no Supabase env
vars set): `/`, `/about`, `/programs`, `/contact` all return `200`, and the
new middleware does not throw or block anything.

---

## 6. Applying this migration to your real Supabase project

This has **not** been done yet — it requires network access this sandbox
doesn't have, and/or your project's credentials. Once you have a Supabase
project, run this from a machine/CI with normal internet access:

```bash
# 1. Authenticate the CLI (opens a browser)
npx supabase login

# 2. Link this repo to your project (find the ref in your project's URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. Push the migration
npx supabase db push

# 4. (optional) Generate real TypeScript types from the live schema,
#    replacing the hand-written lib/supabase/database.types.ts
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

If you'd rather not use the CLI, you can instead open the Supabase
Dashboard → SQL Editor and paste the contents of
`supabase/migrations/20260905024107_init_roles_and_profiles.sql` directly.
The file is idempotent (`create if not exists`, `drop ... if exists` before
every `create trigger`/`create policy`), so it's safe to run more than
once.

After linking, also set `.env.local` from `.env.local.example` using the
URL/keys from **Project Settings → API**, and (in production) set the same
three variables as encrypted secrets in your hosting provider — never in
a committed file.

---

## 7. Network limitation (please read)

From this sandboxed build environment, outbound requests to
`supabase.com` / `*.supabase.co` are blocked by the environment's egress
policy:

```
$ curl -sv https://api.supabase.com
< HTTP/2 403
< x-deny-reason: host_not_allowed
Host not in allowlist: api.supabase.com.
```

This means **no credentials could have made `supabase link` /
`supabase db push` work from here** — it's an environment restriction, not
a missing-credentials problem. The commands in §6 are written to be run by
you (or a CI runner) somewhere with normal internet access.

---

## 8. What's intentionally NOT here yet

`courses`, `course_modules`, `lessons`, `enrollments`, `learning_progress`,
`quizzes`, `questions`, `quiz_attempts`, `assignments`, `submissions`,
`payments`, `blog_posts`, `blog_categories`, `certificates`, `attendance`,
`notifications` — none of these tables exist. `profiles.id` is the stable
foreign-key anchor they'll all reference when they're built in later
phases, so adding them won't require restructuring what's here.

No `/login`, `/signup`, `/student`, `/tutor`, or `/admin` routes/pages
exist yet either — this phase is data-layer only.
