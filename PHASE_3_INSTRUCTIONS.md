# Phase 3 — Authentication: How to Apply + Final Report (Revision 4)

**This revision makes one minimal, targeted correction** based on review
of the actual configured Supabase Redirect URL allow-list for this
project, which currently contains exact entries (no wildcards):
```
https://diadem-academy.vercel.app/auth/confirm
http://localhost:3000
http://localhost:3000/auth/confirm
```
Supabase matches the `redirectTo` value against this list **exactly**.
`forgotPasswordAction` was sending `${origin}/auth/confirm?next=/reset-password`
— the `?next=...` query string meant the URL Supabase received didn't
byte-for-byte match either allow-listed `/auth/confirm` entry, which could
cause Supabase to reject the match and silently fall back to the
project's configured Site URL instead of actually reaching this app's
`/auth/confirm` route.

**The fix is exactly one line:** `forgotPasswordAction` now sends
`${origin}/auth/confirm` — no query string. Nothing about the route's own
security logic changed or needed to change: `/auth/confirm`'s
`DEFAULT_NEXT_PATH = "/reset-password"` already sends the person to
`/reset-password` whenever no valid `next` is present (which is now
always the case for this flow), so behavior is identical to before —
only the URL Supabase has to match got simpler and more reliable.
`resolveSafeNext()`, `ALLOWED_NEXT_PATHS`, `getRequestOrigin()`, both the
`token_hash`/`type` and `code` exchange branches, and every other
Revision 3 protection are untouched.

Revision 3's fix (this route deriving its origin from `getRequestOrigin()`
instead of the raw request, plus the `next` allow-list itself) and
Revision 2's fix (the proper `/auth/confirm` session-exchange flow) are
both unchanged and still in place — see their sections below.

This was built and fully verified in a sandboxed copy of the project (this
environment has no access to `~/Documents/diadem-academy`, your GitHub
repo, or your real Supabase project). `docs/apply-phase3.sh` contains the
exact, byte-for-byte content of every file changed, independently
re-verified this revision (see §8).

---

# Revision 3 (still in effect)

**This revision corrects a security gap found in review of Revision 2:**
`app/auth/confirm/route.ts` was still deriving its redirect origin from
`new URL(request.url).origin` — i.e. the raw incoming request — which
silently defeated the Revision 2 hardening of `lib/get-origin.ts` for this
one route. It's fixed now: this route uses the same `getRequestOrigin()`
as the rest of the auth flow for every redirect it issues, and the `next`
destination is now validated against a strict allow-list (currently just
`/reset-password`) instead of being used as-is — so `next=//evil.com` or
`next=https://evil.com` can no longer send anyone anywhere but this app.

Revision 2's fixes (proper `/auth/confirm` session-exchange flow instead
of client-side event-listening, and the `getRequestOrigin()` priority
order itself) are unchanged and still in place — see the Revision 2
section below for those details.

This was built and fully verified in a sandboxed copy of the project (this
environment has no access to `~/Documents/diadem-academy`, your GitHub
repo, or your real Supabase project). `docs/apply-phase3.sh` contains the
exact, byte-for-byte content of every file changed, independently
re-verified this revision (see §8).

---

## Exact terminal commands to apply this

```bash
cd ~/Documents/diadem-academy

# 1. Copy the updated docs/apply-phase3.sh from this deliverable into your
#    project at the same path, then run it (safe to re-run over the
#    revision-1 version — it just overwrites the same files again):
bash docs/apply-phase3.sh

# 2. No new dependencies were added, so no install is required. If you
#    want to double-check anyway:
npm install

# 3. Verify
npx tsc --noEmit
npm run build
npm run lint

# 4. Review before committing anything
git status
git diff --check

# 5. Only if you're happy with it — commit (not run for you)
# git add -A
# git commit -m "Phase 3 (rev 2): fix password-recovery session flow and origin trust"
```

The script only **writes files** — no git, no install, no commit, no push.

---

## What changed in Revision 3

### `app/auth/confirm/route.ts` — origin and `next` destination hardened

**Before (the bug):**
```ts
const { searchParams, origin } = new URL(request.url);
// ...
return NextResponse.redirect(`${origin}${next}`);
```
`origin` here came straight from `request.url`, which reflects whatever
`Host`/`X-Forwarded-Host` the request arrived with — exactly the
untrusted source `lib/get-origin.ts` was hardened against in Revision 2.
Using it here meant that hardening didn't actually apply to this route.

**After (the fix):**
```ts
import { getRequestOrigin } from "@/lib/get-origin";
// ...
const trustedOrigin = getRequestOrigin();
// ...
return NextResponse.redirect(`${trustedOrigin}${next}`);
```
Every redirect this route issues — success or failure — now uses the same
trusted-origin resolution as `forgotPasswordAction` and every other auth
action. `new URL(request.url)` is still used, but only to read
`searchParams` (the query string) — never `.origin` — so there is no
remaining place in the auth flow that derives a redirect target from the
raw request.

**Also fixed — the `next` destination is no longer trusted as-is.**
Previously, whatever value arrived in `?next=...` was concatenated
directly into the redirect target. Since this Route Handler is public
(anyone can hit `/auth/confirm?next=...` without a valid token — the
token/code verification happens independently of what `next` is), an
unvalidated `next` is a classic open-redirect vector: `next=//evil.com` or
`next=https://evil.com` would have produced a redirect to an external
site after a successful — or even attempted — verification.

Fixed with a strict allow-list:
```ts
const ALLOWED_NEXT_PATHS = new Set(["/reset-password"]);
const DEFAULT_NEXT_PATH = "/reset-password";

function resolveSafeNext(rawNext: string | null): string {
  if (rawNext && ALLOWED_NEXT_PATHS.has(rawNext)) {
    return rawNext;
  }
  return DEFAULT_NEXT_PATH;
}
```
Phase 3 only ever needs to land on `/reset-password`, so anything that
isn't exactly that string falls back to it — there is currently no way to
make this route redirect anywhere else, internal or external, regardless
of what's supplied in the query string. If a later phase needs this route
to support another authenticated destination, add it to
`ALLOWED_NEXT_PATHS` explicitly rather than loosening the check to accept
arbitrary paths.

Verified in isolation (pure logic, no Supabase needed):
```
PASS  input="/reset-password"       -> "/reset-password"
PASS  input="//evil.com"            -> "/reset-password"
PASS  input="https://evil.com"      -> "/reset-password"
PASS  input=null                    -> "/reset-password"
PASS  input="/admin"                -> "/reset-password"
5/5 passed
```

The PKCE cross-device limitation documentation (in the route's own
comments and below) is unchanged.

---

## What changed in Revision 2 (still in effect)

### 1. `app/auth/confirm/route.ts` — new file
A Route Handler that exchanges Supabase's emailed link for a real,
cookie-backed session **before** `/reset-password` ever loads. It handles
**both** formats Supabase can send, so it works regardless of how your
project's email templates are currently configured:

- **`token_hash` + `type`** (Supabase's current recommended format for
  SSR apps) → `supabase.auth.verifyOtp({ type, token_hash })`. Does **not**
  require the link to be opened on the same device/browser that requested
  the reset.
- **`code`** (PKCE — what Supabase's *default*, unmodified email template
  produces when going through Supabase's own hosted verification, which is
  what you get out of the box) → `supabase.auth.exchangeCodeForSession(code)`.
  **Important limitation, inherent to PKCE, not a bug in this code:** this
  path requires the matching `code_verifier` cookie that was set in the
  same browser when the reset was requested. If the person requests a
  reset on their phone but opens the email on their laptop, this exchange
  will fail — cleanly, redirecting to `/reset-password?error=invalid_link`,
  not a crash.

**If you want cross-device reset links to work reliably**, update your
Supabase Dashboard → Authentication → Email Templates → "Reset Password"
template to point directly at the `token_hash` format:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```
(hardcode `next=/reset-password` in the template itself, rather than using
`{{ .RedirectTo }}`, to avoid double-encoding the value the app already
passes in). This is a **Supabase Dashboard configuration change you need
to make yourself** — it's outside what code alone can control, and outside
what I can verify without access to your real project. Until you make that
change, the app still works correctly for the common case (reset requested
and completed in the same browser).

### 2. `app/reset-password/page.tsx` — rewritten as a Server Component
Instead of a client component polling for a `PASSWORD_RECOVERY` event with
a 4-second timeout (the old, less reliable approach), this page now does
one authoritative, server-side check: does `supabase.auth.getUser()`
return a real user? If yes, render the password form; if no, show
"invalid or expired link" with a link back to `/forgot-password`. Marked
`export const dynamic = "force-dynamic"` since it depends on the
per-request session cookie.

### 3. `components/auth/ResetPasswordForm.tsx` — rewritten
No longer touches the Supabase browser client directly or listens for
auth events. It's now a thin client component (for the password
show/hide inputs) that submits to a new server action,
`updatePasswordAction`, via `useFormState` — the same pattern as every
other auth form in this codebase.

### 4. `lib/auth/actions.ts` — added `updatePasswordAction`, updated `forgotPasswordAction`
- `forgotPasswordAction`'s `redirectTo` now points to
  `${origin}/auth/confirm` instead of straight to `/reset-password`.
  (Revision 4: this is a bare URL, no `?next=...` query string — see
  the Revision 4 section below for why.)
- New `updatePasswordAction`: re-verifies a real session exists (never
  assumes the page-level check is enough — defense in depth, same
  philosophy as the role checks), calls
  `supabase.auth.updateUser({ password })`, then explicitly signs the
  recovery session out so the person logs back in fresh with their new
  password, and returns a success message with a link to `/login`.

### 5. `lib/get-origin.ts` — rewritten
Old priority order effectively trusted `X-Forwarded-Host`/`Host` first.
**New priority order:**
1. `NEXT_PUBLIC_SITE_URL` — an explicit, trusted origin you set as an
   environment variable (recommended for production).
2. `VERCEL_URL` — Vercel's auto-provided per-deployment URL, used only
   when step 1 isn't set (so preview deployments still work without
   manual config, but a real custom domain always wins when configured).
3. The request's `Host` header — used **only** outside of production
   (`NODE_ENV !== "production"`), and only when it looks like
   `localhost`/`127.0.0.1`. Never trusted in a deployed environment.
4. `siteConfig.url` (`https://diademconsult.com.ng`) — the hardcoded,
   known-good fallback, so this function can never return a value
   influenced solely by request input.

**Why this matters:** the old version would use whatever `Host` header
arrived with the request as the redirect origin in *any* environment,
including production. Behind certain proxy/CDN misconfigurations, that
header can be influenced by the client — for a value that ends up inside
a password-reset email link, that's a real (if narrow) open-redirect /
host-header-injection risk class, worth closing properly rather than
leaving as a theoretical gap.

**Regardless of what this function returns, Supabase itself enforces an
independent allow-list** (Dashboard → Authentication → URL Configuration →
Redirect URLs) — whatever origin you end up using in production
(`https://diademconsult.com.ng` by default here) **must be added there**,
or Supabase will reject the redirect rather than silently allowing it.
This is a second, independent layer of protection.

### 6. `.env.local.example` — added one new optional variable
```
NEXT_PUBLIC_SITE_URL=https://diademconsult.com.ng
```
Not a secret. Optional — if unset, the app falls back to `VERCEL_URL`
then to the hardcoded production domain, both of which are already
correct for this project. Setting it explicitly in production is best
practice and gives you an easy override without a code change if the
domain ever changes.

---

## Full file list (this revision)

### New files
```
lib/validation.ts
lib/get-origin.ts
lib/auth/actions.ts
lib/supabase/session.ts
app/auth/confirm/route.ts          <- new this revision
components/auth/PasswordInput.tsx
components/auth/SubmitButton.tsx
components/auth/FormMessage.tsx
components/auth/AuthCard.tsx
components/auth/LoginForm.tsx
components/auth/SignupForm.tsx
components/auth/ForgotPasswordForm.tsx
components/auth/ResetPasswordForm.tsx
components/dashboard/DashboardShell.tsx
app/login/page.tsx
app/signup/page.tsx
app/forgot-password/page.tsx
app/reset-password/page.tsx
app/student/page.tsx
app/tutor/page.tsx
app/admin/page.tsx
```

### Modified files
- `lib/supabase/database.types.ts` — (from rev 1) type-inference fix.
- `middleware.ts` — (from rev 1) role-based route gating.
- `components/Header.tsx` — (from rev 1) added Log In link.
- `.env.local.example` — (rev 2) added `NEXT_PUBLIC_SITE_URL`.

Everything else from the original Phase 3 report (routes, role
authorization design, dashboard foundations, database — unchanged, no
new migration) still applies exactly as previously reported.

---

## Tests performed this revision (Revision 3)

- `npx tsc --noEmit` — **pass**, zero errors.
- `npm run build` — **pass**, identical route table to Revision 2
  (`/auth/confirm` unchanged in shape, only its internal logic changed).
- `npm run lint` — **pass**, zero warnings/errors.
- Production server smoke test, including two explicit open-redirect
  attempts:
  - `GET /auth/confirm?next=//evil.com` and
    `GET /auth/confirm?next=https://evil.com` — both correctly fail
    closed with `500` in this sandbox (no Supabase configured, same as
    every other Supabase-dependent route), rather than ever reaching a
    redirect to the external domain.
  - The `resolveSafeNext()` allow-list logic itself was additionally
    tested in complete isolation (pure function, no server, no Supabase)
    against 5 inputs including both attack strings — **5/5 passed**,
    confirmed above.
- **Independent reproducibility check, redone for Revision 3**: applied
  the regenerated `apply-phase3.sh` to a bare scratch copy, confirmed all
  **25** written files are byte-for-byte identical to the verified
  originals (zero mismatches), then reconstructed the full project and
  confirmed it independently `npm install`s, `next build`s, and
  `next lint`s cleanly with the same route table.

## Tests performed in Revision 2 (still valid, unaffected by this fix)

- `npx tsc --noEmit` — **pass**, zero errors.
- `npm run build` — **pass**. Route table now includes:
  ```
  ○ /login, /signup, /forgot-password     (static)
  ƒ /auth/confirm                          (route handler)
  ƒ /reset-password                        (dynamic — now checks a real session)
  ƒ /student, /tutor, /admin                (dynamic, unchanged)
  ```
- `npm run lint` — **pass**, zero warnings/errors.
- Production server smoke test (no Supabase env vars configured, as
  before):
  - `/`, `/about`, `/programs`, `/contact`, `/login`, `/signup`,
    `/forgot-password` → all `200`.
  - `/reset-password`, `/student`, `/tutor`, `/admin`, `/auth/confirm`
    (no params) → all `500`, the same intentional fail-closed behavior as
    before (these all now correctly check a real session/exchange a real
    code, which requires Supabase to be configured — there is none in
    this sandbox). Server did not crash; every other route kept working.
- **Independent reproducibility check, redone for this revision**:
  applied the regenerated `apply-phase3.sh` to a completely bare scratch
  copy, confirmed all **25** written files are byte-for-byte identical to
  the verified originals (zero mismatches), then reconstructed the full
  project around them and confirmed it independently `npm install`s,
  `next build`s, and `next lint`s cleanly with the same route table above.

## Security audit (re-run this revision)
- No `SUPABASE_SERVICE_ROLE_KEY` reference outside `lib/supabase/admin.ts`.
- No hardcoded Supabase URLs or JWT-like strings anywhere.
- No `localStorage` usage anywhere.
- No `.env.local` file present in the project.
- `git status` / `git diff --check`: not run here — this sandbox copy was
  never a git repository (it isn't your actual repo). Run both yourself
  in your real project immediately after applying the script and before
  committing, per your own instructions.

## What still cannot be tested from here (unchanged limitation)
This sandbox cannot reach `supabase.com` / `*.supabase.co` at all — same
confirmed restriction as Phase 2. Everything that requires a real,
reachable Supabase project — actual signup, actual login, a real password
reset email round-trip through `/auth/confirm`, and confirming which of
the two link formats your project's current email template actually
produces — needs to be tested by you. Suggested order:

1. Apply this revision, fill in `.env.local` (including the new
   `NEXT_PUBLIC_SITE_URL` if you want it explicit).
2. `npm run dev`, go to `/forgot-password` with a real test account's
   email, in the same browser you'll click the email link in.
3. Click the link → confirm you land on `/reset-password` with the actual
   form (not the "invalid link" state) → set a new password → confirm you
   land on the success screen → log in with the new password.
4. Then deliberately test the cross-device case if it matters to you:
   request a reset on one browser, try opening the email link in a
   *different* browser/device. If it fails with "invalid or expired",
   that's the documented PKCE limitation above — switch your email
   template to the `token_hash` format if you need this to work reliably.
5. Everything else from the original Phase 3 checklist (student/tutor/
   admin role redirects, logout) is unchanged — see the original report
   for that checklist.
