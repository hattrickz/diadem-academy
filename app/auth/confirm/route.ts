import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/get-origin";

// This is the landing point for Supabase Auth email links that need to
// establish a real, cookie-backed session before the user continues —
// currently used by the password-reset flow (forgotPasswordAction sets
// `redirectTo: ${origin}/auth/confirm`, with no query string — this
// route's own DEFAULT_NEXT_PATH below is what sends the person on to
// /reset-password, since Supabase's Redirect URL allow-list matches the
// redirect URL exactly and a bare `/auth/confirm` is what's registered
// there).
//
// It supports BOTH styles Supabase can send, so it works correctly
// regardless of how your project's email templates are configured:
//
//   1. `token_hash` + `type` (Supabase's current recommended format for
//      SSR apps) — verified directly via supabase.auth.verifyOtp(). This
//      does NOT require the link to be opened in the same browser/device
//      that requested the reset.
//   2. `code` (PKCE) — the format Supabase's DEFAULT hosted email
//      templates produce when @supabase/ssr's cookie-based client (which
//      defaults to the PKCE flow) is in use — exchanged via
//      supabase.auth.exchangeCodeForSession(). NOTE: PKCE requires the
//      matching code_verifier cookie that was set when the reset was
//      requested, so this path only works if the link is opened in the
//      SAME browser the request was made from. If a person opens their
//      reset email on a different device/browser, this exchange will
//      fail — that's an inherent PKCE limitation, not a bug here. If you
//      want cross-device reset links to work reliably, update your
//      Supabase Dashboard → Authentication → Email Templates → "Reset
//      Password" template to use format 1 instead:
//        {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
//      (hardcode `next=/reset-password` in the template itself rather
//      than `{{ .RedirectTo }}`, to avoid double-encoding the value this
//      route already passes in as `redirectTo`).
//
// Two things are handled deliberately carefully here:
//
//   - The redirect origin is NEVER taken from the incoming request
//     (request.url's origin reflects whatever Host header arrived with
//     the request, which is exactly the untrusted source
//     lib/get-origin.ts was hardened against). This route uses that same
//     getRequestOrigin() — a trusted, configured origin — for every
//     redirect it issues, success or failure. Building the origin any
//     other way here would silently defeat that hardening for this one
//     route.
//   - The `next` destination is NOT allowed to be an arbitrary value.
//     Phase 3 only ever needs to land on /reset-password, so `next` is
//     validated against a strict allow-list of known-internal paths
//     rather than trusted as-is — this closes off open-redirect vectors
//     like `next=//evil.com` or `next=https://evil.com` before they ever
//     reach NextResponse.redirect(). As more authenticated destinations
//     are added in later phases, add them to ALLOWED_NEXT_PATHS rather
//     than loosening this check.
const ALLOWED_NEXT_PATHS = new Set(["/reset-password"]);
const DEFAULT_NEXT_PATH = "/reset-password";

function resolveSafeNext(rawNext: string | null): string {
  if (rawNext && ALLOWED_NEXT_PATHS.has(rawNext)) {
    return rawNext;
  }
  return DEFAULT_NEXT_PATH;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = resolveSafeNext(searchParams.get("next"));

  const trustedOrigin = getRequestOrigin();
  const supabase = createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${trustedOrigin}${next}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${trustedOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${trustedOrigin}/reset-password?error=invalid_link`);
}
