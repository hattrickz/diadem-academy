#!/usr/bin/env bash
# Phase 3 (Authentication) — apply script for the canonical diadem-academy project.
# Run this from the ROOT of your real project: ~/Documents/diadem-academy
#
# Revision 4: forgotPasswordAction now sends redirectTo as a bare
# ${origin}/auth/confirm (no '?next=...' query string), so it matches
# the exact entries configured in Supabase's Redirect URL allow-list.
# /auth/confirm's own DEFAULT_NEXT_PATH ('/reset-password') already
# covers the destination, so behavior is unchanged — only the URL
# Supabase has to match got simpler. No security logic changed:
# resolveSafeNext(), ALLOWED_NEXT_PATHS, getRequestOrigin(), and both
# the token_hash/type and code exchange branches are untouched.
# See docs/PHASE_3_INSTRUCTIONS.md for full details.
#
# This script only WRITES files. It does not run npm install (no new
# dependencies were added this phase — @supabase/ssr, @supabase/supabase-js,
# lucide-react, react-dom and server-only were all already present from
# Phase 1/2). It does not touch git, does not commit, does not push.
set -euo pipefail

if [ ! -f package.json ] || ! grep -q '"diadem-consult-academy"' package.json; then
  echo 'Run this from the root of the diadem-academy project (package.json not found/matched).'
  exit 1
fi

echo 'Writing lib/validation.ts'
mkdir -p 'lib'
cat > 'lib/validation.ts' << 'DIADEM_EOF'
// Small, dependency-free validation helpers shared by every auth form.
// Client-side checks here are for immediate UX feedback only — the server
// actions in lib/auth/actions.ts re-validate everything and are the
// authoritative check.

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sensible-but-not-punishing password rule: at least 8 characters, with at
 * least one letter and one number. Returns null when valid, or a
 * human-readable reason when not.
 */
export function passwordIssue(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
DIADEM_EOF

echo 'Writing lib/get-origin.ts'
mkdir -p 'lib'
cat > 'lib/get-origin.ts' << 'DIADEM_EOF'
import "server-only";
import { headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";

/**
 * Resolves the trusted origin to use for Supabase Auth `redirectTo` /
 * `emailRedirectTo` URLs (signup confirmation, password reset, etc.).
 *
 * This is security-sensitive: whatever this returns ends up embedded in an
 * email link that, once clicked, can establish an authenticated session.
 * It deliberately does NOT trust the raw incoming `Host` /
 * `X-Forwarded-Host` request headers as its primary source — behind some
 * proxy/load-balancer configurations those headers can be influenced by
 * the client, which would otherwise make this an open-redirect /
 * host-header-injection vector for a security-sensitive URL.
 *
 * Priority order:
 *   1. `NEXT_PUBLIC_SITE_URL` — an explicitly configured, trusted origin
 *      you set in your hosting provider's environment variables (e.g.
 *      `https://diademconsult.com.ng` in production). This is the
 *      recommended way to pin the value used in production and the one
 *      that should be added to Supabase's Redirect URL allow-list.
 *   2. `VERCEL_URL` — automatically provided by Vercel for every
 *      deployment (including preview deployments), used only when
 *      `NEXT_PUBLIC_SITE_URL` isn't set. A custom production domain
 *      (via step 1) always takes priority over the `*.vercel.app` alias.
 *   3. The current request's `Host` header — used ONLY outside of
 *      production, and only when it actually looks like a local dev host
 *      (`localhost` / `127.0.0.1`). Never trusted in production.
 *   4. `siteConfig.url` — the hardcoded, known-good production domain,
 *      used as the final fallback so this function can never return a
 *      value influenced by request input alone.
 *
 * Whatever this returns must ALSO be present in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs — Supabase enforces
 * that allow-list itself regardless of what this function produces, which
 * is a second, independent layer of protection against this ever being
 * used to redirect somewhere unintended. If you want Vercel preview
 * deployments to support password reset / signup confirmation links, add
 * a matching wildcard (e.g. `https://*.vercel.app` or your own preview
 * domain pattern) to that allow-list; otherwise Supabase will safely
 * reject the redirect rather than silently allowing it.
 */
export function getRequestOrigin(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  if (process.env.NODE_ENV !== "production") {
    const headerList = headers();
    const host = headerList.get("host");
    if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
      return `http://${host}`;
    }
  }

  return siteConfig.url;
}
DIADEM_EOF

echo 'Writing lib/auth/actions.ts'
mkdir -p 'lib/auth'
cat > 'lib/auth/actions.ts' << 'DIADEM_EOF'
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/get-origin";
import { isValidEmail, passwordIssue } from "@/lib/validation";
import type { UserRole } from "@/lib/supabase/database.types";

export type AuthFormState = {
  error?: string;
  success?: string;
} | null;

function roleHome(role: UserRole | null | undefined): string {
  if (role === "tutor") return "/tutor";
  if (role === "admin") return "/admin";
  return "/student";
}

// ---------------------------------------------------------------------------
// SIGN UP
// ---------------------------------------------------------------------------
export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: "Please fill in every field." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }
  const pwIssue = passwordIssue(password);
  if (pwIssue) {
    return { error: pwIssue };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = createClient();
  const origin = getRequestOrigin();

  // We intentionally only ever send `full_name` in metadata — never `role`.
  // The database trigger (handle_new_user) is the only thing that sets the
  // initial role, and it always sets it to 'student'. Nothing here can
  // request an elevated role at signup.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/login`,
    },
  });

  if (error) {
    // Don't leak internal Supabase/Postgres error details to the client.
    const message = /already registered|already exists/i.test(error.message)
      ? "An account with this email already exists. Try logging in instead."
      : "We couldn't create your account. Please try again.";
    return { error: message };
  }

  // If email confirmation is required, Supabase returns a user but no
  // session. Tell the person clearly what to do next instead of assuming
  // they're logged in.
  if (data.user && !data.session) {
    return {
      success:
        "Check your email to confirm your account, then log in. If you don't see it, check your spam folder.",
    };
  }

  if (data.session) {
    // A brand-new signup is always role='student' (set by the database
    // trigger), so there's no need to look up a profile here.
    redirect("/student");
  }

  return {
    success: "Account created. You can now log in.",
  };
}

// ---------------------------------------------------------------------------
// LOG IN
// ---------------------------------------------------------------------------
export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately generic — don't confirm/deny whether the email exists.
    return { error: "Incorrect email or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Something went wrong. Please try again." };
  }

  // Role comes from the database, never from anything the client sent.
  // NOTE: .single<{ role: UserRole }>() explicitly types this query's
  // result. Without it, this specific query shape resolves to `never`
  // under TypeScript's strict mode with @supabase/supabase-js 2.115's
  // generic Database typing — a verified upstream type-inference edge
  // case, not a schema/data problem (confirmed the same query resolves
  // correctly with strict mode off, isolating it to type inference only).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  redirect(roleHome(profile?.role));
}

// ---------------------------------------------------------------------------
// LOG OUT
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// FORGOT PASSWORD
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = createClient();
  const origin = getRequestOrigin();

  // Route through /auth/confirm rather than straight to /reset-password.
  // Supabase's email link (by default, verified through Supabase's own
  // hosted endpoint) redirects here with either a PKCE `code` or, if your
  // Supabase email template has been customized to the newer
  // `token_hash`+`type` format, those params instead. Either way,
  // /auth/confirm exchanges it for a real session server-side (setting
  // the session cookie via @supabase/ssr) before sending the person on to
  // /reset-password — so by the time that page loads, updateUser() has an
  // authenticated recovery session to act on. See app/auth/confirm/route.ts
  // for the exchange logic, and docs/BACKEND.md for the PKCE cross-device
  // caveat and how to switch to the token_hash template if you want to
  // avoid it.
  //
  // Deliberately no `?next=...` query string here: Supabase's Redirect
  // URL allow-list matches the redirect URL exactly, and Phase 3 only
  // ever needs one destination anyway. /auth/confirm's own
  // DEFAULT_NEXT_PATH ("/reset-password") already covers this — see
  // resolveSafeNext() in app/auth/confirm/route.ts, which is what
  // actually decides the destination regardless of what (if anything) is
  // in the query string.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  // Same message regardless of outcome — avoids confirming whether an
  // account exists for this address (account enumeration protection).
  return {
    success:
      "If an account exists for that email address, a password reset link has been sent.",
  };
}

// ---------------------------------------------------------------------------
// UPDATE PASSWORD (completes the forgot-password flow)
// ---------------------------------------------------------------------------
// Called from /reset-password. By the time this runs, app/auth/confirm's
// route handler has already exchanged the emailed link's code/token_hash
// for a real, cookie-backed recovery session — this action just verifies
// that session actually exists (never assumes it does) and then updates
// the password on it. It never accepts a user id, email, or token from
// the client; the only thing the client controls here is the new password
// itself.
export async function updatePasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const pwIssue = passwordIssue(password);
  if (pwIssue) {
    return { error: pwIssue };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error:
        "We couldn't update your password. Please request a new reset link and try again.",
    };
  }

  // End the recovery session so the person logs back in with their new
  // password, rather than silently remaining signed in under a session
  // that started as a password-recovery flow.
  await supabase.auth.signOut();

  return { success: "Your password has been updated. You can now log in." };
}
DIADEM_EOF

echo 'Writing lib/supabase/session.ts'
mkdir -p 'lib/supabase'
cat > 'lib/supabase/session.ts' << 'DIADEM_EOF'
import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";

/**
 * Server-only helper for Server Components / Server Actions.
 *
 * Retrieves the authenticated user directly from Supabase Auth (never from
 * a client-supplied value) and their `profiles` row — which is where the
 * authoritative `role` lives. Every protected page should call this itself
 * rather than trusting anything passed from the browser, as defense in
 * depth alongside middleware.ts.
 */
export async function getUserWithProfile(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  // NOTE: .single<Profile>() explicitly types this query's result.
  // See the matching note in lib/auth/actions.ts for why this is needed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile: profile ?? null };
}
DIADEM_EOF

echo 'Writing lib/supabase/database.types.ts'
mkdir -p 'lib/supabase'
cat > 'lib/supabase/database.types.ts' << 'DIADEM_EOF'
// Minimal hand-written types for the Phase 2 schema.
// Once the Supabase CLI can reach the real project from an environment with
// network access, prefer generating this file instead:
//
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
//
// This hand-written version exists so the app has type safety now without
// requiring a live connection.

export type UserRole = "student" | "tutor" | "admin";

export interface Profile {
  id: string; // uuid, references auth.users.id
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Database {
  // Required by @supabase/supabase-js v2's newer generic type resolution.
  // This is a type-only marker (no runtime meaning) — '12' matches the
  // PostgREST version this client version expects by default.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, "id" | "role">>;
        // `role` is intentionally excluded from client-side Update — role
        // changes are blocked by the prevent_role_self_update trigger and
        // must go through server-side code using the service-role key.
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
DIADEM_EOF

echo 'Writing .env.local.example'
mkdir -p '.'
cat > '.env.local.example' << 'DIADEM_EOF'
# Copy this file to .env.local and fill in real values.
# .env.local is git-ignored (see .gitignore) — never commit real secrets.

# --- Public (safe to expose to the browser) -----------------------------
# Found in Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY

# Optional: the trusted, canonical origin used to build auth email links
# (password reset, signup confirmation). Not a secret. If unset, falls
# back to Vercel's auto-provided VERCEL_URL, then to the hardcoded
# production domain in lib/site-config.ts. Set this explicitly in
# production for clarity, and make sure the same value is added to
# Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
NEXT_PUBLIC_SITE_URL=https://diademconsult.com.ng

# --- Server-only secret — NEVER expose this to the browser --------------
# Do NOT prefix with NEXT_PUBLIC_. Only read from server-side code
# (lib/supabase/admin.ts), never from a Client Component.
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
DIADEM_EOF

echo 'Writing components/auth/PasswordInput.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/PasswordInput.tsx' << 'DIADEM_EOF'
"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  name,
  label,
  autoComplete,
  required = true,
}: {
  name: string;
  label?: string;
  autoComplete: "new-password" | "current-password";
  required?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-navy-800 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          minLength={8}
          aria-label={label ? undefined : "Password"}
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 pr-11 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-navy-700/60 hover:text-navy-800"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
DIADEM_EOF

echo 'Writing components/auth/SubmitButton.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/SubmitButton.tsx' << 'DIADEM_EOF'
"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
      {pending ? "Please wait…" : children}
    </button>
  );
}
DIADEM_EOF

echo 'Writing components/auth/FormMessage.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/FormMessage.tsx' << 'DIADEM_EOF'
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;

  const isError = Boolean(error);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-diadem-red/30 bg-diadem-red/5 text-diadem-red"
          : "border-emerald-300 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}
      <span>{error ?? success}</span>
    </div>
  );
}
DIADEM_EOF

echo 'Writing components/auth/AuthCard.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/AuthCard.tsx' << 'DIADEM_EOF'
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh] flex items-center">
      <div className="container-px mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt={`${siteConfig.name} logo`}
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
            />
            <span className="font-extrabold text-navy-800">Diadem Consult</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-800">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-navy-700/75 max-w-sm">{subtitle}</p>
          )}
        </div>

        <div className="rounded-xl2 bg-white p-7 md:p-9 shadow-premium ring-1 ring-navy-100">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-navy-700/80">{footer}</div>}
      </div>
    </section>
  );
}
DIADEM_EOF

echo 'Writing components/auth/LoginForm.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/LoginForm.tsx' << 'DIADEM_EOF'
"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/auth/actions";
import PasswordInput from "@/components/auth/PasswordInput";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

const initialState: AuthFormState = null;

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage error={state?.error} success={state?.success} />

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-navy-800 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-semibold text-navy-800">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-semibold text-skyblue-600 hover:text-skyblue-700">
            Forgot password?
          </Link>
        </div>
        <PasswordInput name="password" autoComplete="current-password" />
      </div>

      <SubmitButton>Log In</SubmitButton>
    </form>
  );
}
DIADEM_EOF

echo 'Writing components/auth/SignupForm.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/SignupForm.tsx' << 'DIADEM_EOF'
"use client";

import { useFormState } from "react-dom";
import { signupAction, type AuthFormState } from "@/lib/auth/actions";
import PasswordInput from "@/components/auth/PasswordInput";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

const initialState: AuthFormState = null;

export default function SignupForm() {
  const [state, formAction] = useFormState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage error={state?.error} success={state?.success} />

      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-navy-800 mb-1.5">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200"
          placeholder="e.g. Ada Obi"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-navy-800 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200"
          placeholder="you@example.com"
        />
      </div>

      <PasswordInput name="password" label="Password" autoComplete="new-password" />
      <p className="-mt-3 text-xs text-navy-700/60">
        At least 8 characters, with a letter and a number.
      </p>

      <PasswordInput name="confirmPassword" label="Confirm password" autoComplete="new-password" />

      <SubmitButton>Create Account</SubmitButton>

      <p className="text-xs text-navy-700/60 text-center">
        New accounts start as a student account. Tutor and admin access is
        granted by Diadem Consult Academy staff.
      </p>
    </form>
  );
}
DIADEM_EOF

echo 'Writing components/auth/ForgotPasswordForm.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/ForgotPasswordForm.tsx' << 'DIADEM_EOF'
"use client";

import { useFormState } from "react-dom";
import { forgotPasswordAction, type AuthFormState } from "@/lib/auth/actions";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

const initialState: AuthFormState = null;

export default function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage error={state?.error} success={state?.success} />

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-navy-800 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200"
          placeholder="you@example.com"
        />
      </div>

      <SubmitButton>Send Reset Link</SubmitButton>
    </form>
  );
}
DIADEM_EOF

echo 'Writing components/auth/ResetPasswordForm.tsx'
mkdir -p 'components/auth'
cat > 'components/auth/ResetPasswordForm.tsx' << 'DIADEM_EOF'
"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { updatePasswordAction, type AuthFormState } from "@/lib/auth/actions";
import PasswordInput from "@/components/auth/PasswordInput";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

const initialState: AuthFormState = null;

// By the time this form renders, app/reset-password/page.tsx has already
// confirmed server-side that a real recovery session exists (established
// by app/auth/confirm/route.ts). This form just collects the new password
// and submits it to updatePasswordAction, which re-verifies the session
// itself before calling supabase.auth.updateUser() — this component never
// touches the Supabase client directly.
export default function ResetPasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="space-y-5">
        <FormMessage success={state.success} />
        <Link href="/login" className="btn-primary w-full">
          Continue to Log In
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage error={state?.error} />

      <PasswordInput name="password" label="New password" autoComplete="new-password" />
      <p className="-mt-3 text-xs text-navy-700/60">
        At least 8 characters, with a letter and a number.
      </p>

      <PasswordInput name="confirmPassword" label="Confirm new password" autoComplete="new-password" />

      <SubmitButton>Update Password</SubmitButton>
    </form>
  );
}
DIADEM_EOF

echo 'Writing components/dashboard/DashboardShell.tsx'
mkdir -p 'components/dashboard'
cat > 'components/dashboard/DashboardShell.tsx' << 'DIADEM_EOF'
import { LogOut, LucideIcon } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/supabase/database.types";

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  tutor: "Tutor",
  admin: "Admin",
};

export interface DashboardSection {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function DashboardShell({
  role,
  displayName,
  email,
  sections,
}: {
  role: UserRole;
  displayName: string;
  email: string | null;
  sections: DashboardSection[];
}) {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh]">
      <div className="container-px mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl2 bg-navy-800 p-7 md:p-9 text-white shadow-premium">
          <div>
            <span className="eyebrow text-skyblue-300">{ROLE_LABEL[role]} Dashboard</span>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold">
              Welcome, {displayName}
            </h1>
            {email && <p className="mt-1 text-sm text-navy-100/75">{email}</p>}
          </div>

          <form action={logoutAction}>
            <button type="submit" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-navy-800 shrink-0">
              <LogOut size={16} /> Log Out
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-xl2 bg-white p-7 shadow-sm ring-1 ring-navy-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
                <s.icon size={22} />
              </div>
              <h2 className="mt-5 font-bold text-navy-800">{s.title}</h2>
              <p className="mt-2 text-sm text-navy-700/70 leading-relaxed">
                {s.description}
              </p>
              <span className="mt-4 inline-block rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700/70">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
DIADEM_EOF

echo 'Writing app/auth/confirm/route.ts'
mkdir -p 'app/auth/confirm'
cat > 'app/auth/confirm/route.ts' << 'DIADEM_EOF'
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
DIADEM_EOF

echo 'Writing app/login/page.tsx'
mkdir -p 'app/login'
cat > 'app/login/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log In",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Log in to access your Diadem Consult Academy account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-skyblue-600 hover:text-skyblue-700">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
DIADEM_EOF

echo 'Writing app/signup/page.tsx'
mkdir -p 'app/signup'
cat > 'app/signup/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create Your Account"
      subtitle="Sign up to start your journey with Diadem Consult Academy."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-skyblue-600 hover:text-skyblue-700">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
DIADEM_EOF

echo 'Writing app/forgot-password/page.tsx'
mkdir -p 'app/forgot-password'
cat > 'app/forgot-password/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset Your Password"
      subtitle="Enter the email address on your account and we'll send you a link to reset your password."
      footer={
        <>
          Remembered it after all?{" "}
          <Link href="/login" className="font-semibold text-skyblue-600 hover:text-skyblue-700">
            Back to log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
DIADEM_EOF

echo 'Writing app/reset-password/page.tsx'
mkdir -p 'app/reset-password'
cat > 'app/reset-password/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/components/auth/AuthCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import FormMessage from "@/components/auth/FormMessage";

// This page depends on the per-request recovery session established by
// app/auth/confirm/route.ts and must never be statically prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // Authoritative, server-side check: is there actually a session here?
  // The recovery link flow (forgotPasswordAction -> /auth/confirm) sets
  // this via a real Supabase session cookie before ever reaching this
  // page — nothing about this check trusts anything from the browser.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthCard title="Set a New Password" subtitle="Choose a new password for your account.">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-5">
          <FormMessage error="This password reset link is invalid or has expired." />
          <Link href="/forgot-password" className="btn-primary w-full">
            Request a New Link
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
DIADEM_EOF

echo 'Writing app/student/page.tsx'
mkdir -p 'app/student'
cat > 'app/student/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, LineChart, Award, ClipboardList, UserCircle } from "lucide-react";
import { getUserWithProfile } from "@/lib/supabase/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

// This page depends on the authenticated user's session/cookies and must
// never be statically prerendered at build time — each request needs a
// fresh, real check against Supabase Auth.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Dashboard",
  robots: { index: false, follow: false },
};

const sections = [
  { icon: BookOpen, title: "My Courses", description: "Courses you're enrolled in will appear here once course enrollment launches." },
  { icon: LineChart, title: "Learning Progress", description: "Track your progress through lessons and modules as they become available." },
  { icon: ClipboardList, title: "Assignments", description: "Assignments and their status will be listed here in a future update." },
  { icon: Award, title: "Certificates", description: "Certificates you've earned will be shown here once available." },
  { icon: UserCircle, title: "Profile", description: "Manage your name, phone number and photo here in a future update." },
];

export default async function StudentDashboardPage() {
  // Server-side authorization — never trust a role from the browser.
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/student");
  }

  // Explicit, loop-safe authorization: only a confirmed 'student' role
  // renders this page. Known other roles go to their own dashboard;
  // anything unexpected (e.g. a missing profile row) goes to a neutral
  // page rather than bouncing between dashboards.
  if (profile?.role === "tutor") {
    redirect("/tutor");
  }
  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role !== "student") {
    redirect("/");
  }

  const displayName = profile?.full_name || user.email || "Student";

  return (
    <DashboardShell
      role="student"
      displayName={displayName}
      email={user.email ?? null}
      sections={sections}
    />
  );
}
DIADEM_EOF

echo 'Writing app/tutor/page.tsx'
mkdir -p 'app/tutor'
cat > 'app/tutor/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, Users, ClipboardList, FileText } from "lucide-react";
import { getUserWithProfile } from "@/lib/supabase/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

// This page depends on the authenticated user's session/cookies and must
// never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutor Dashboard",
  robots: { index: false, follow: false },
};

const sections = [
  { icon: BookOpen, title: "My Courses", description: "Courses you teach will be managed here once course tools are built." },
  { icon: Users, title: "Students", description: "A list of your enrolled students will appear here in a future update." },
  { icon: ClipboardList, title: "Assignments", description: "Create and review assignments here once available." },
  { icon: FileText, title: "Content", description: "Upload lessons, videos and PDF materials here in a future update." },
];

export default async function TutorDashboardPage() {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/tutor");
  }

  // Explicit, loop-safe authorization: only a confirmed 'tutor' role
  // renders this page. Known other roles go to their own dashboard;
  // anything unexpected goes to a neutral page rather than bouncing
  // between dashboards.
  if (profile?.role === "student") {
    redirect("/student");
  }
  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role !== "tutor") {
    redirect("/");
  }

  const displayName = profile?.full_name || user.email || "Tutor";

  return (
    <DashboardShell
      role="tutor"
      displayName={displayName}
      email={user.email ?? null}
      sections={sections}
    />
  );
}
DIADEM_EOF

echo 'Writing app/admin/page.tsx'
mkdir -p 'app/admin'
cat > 'app/admin/page.tsx' << 'DIADEM_EOF'
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, GraduationCap, BookOpen, CreditCard, Newspaper, BarChart3, Settings } from "lucide-react";
import { getUserWithProfile } from "@/lib/supabase/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

// This page depends on the authenticated user's session/cookies and must
// never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

const sections = [
  { icon: Users, title: "Students", description: "Manage student accounts here once the admin CMS is built." },
  { icon: GraduationCap, title: "Tutors", description: "Manage tutor accounts and permissions here in a future update." },
  { icon: BookOpen, title: "Courses & Lessons", description: "Create and manage courses and lessons here once available." },
  { icon: CreditCard, title: "Payments", description: "Review payments and enrollments here in a future update." },
  { icon: Newspaper, title: "Blog", description: "Manage blog posts and categories here once the CMS is built." },
  { icon: BarChart3, title: "Reports", description: "Platform analytics and reports will appear here." },
  { icon: Settings, title: "Settings", description: "Platform-wide settings will be managed here." },
];

export default async function AdminDashboardPage() {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Explicit, loop-safe authorization: only a confirmed 'admin' role
  // renders this page.
  if (profile?.role === "student") {
    redirect("/student");
  }
  if (profile?.role === "tutor") {
    redirect("/tutor");
  }
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const displayName = profile?.full_name || user.email || "Admin";

  return (
    <DashboardShell
      role="admin"
      displayName={displayName}
      email={user.email ?? null}
      sections={sections}
    />
  );
}
DIADEM_EOF

echo 'Writing middleware.ts'
mkdir -p '.'
cat > 'middleware.ts' << 'DIADEM_EOF'
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, UserRole } from "@/lib/supabase/database.types";

// Refreshes the Supabase auth session cookie on every request so server
// components always see an up-to-date session, AND gates access to the
// role-specific dashboards added in Phase 3 (/student, /tutor, /admin).
//
// This is defense-in-depth alongside the authorization check each
// dashboard page performs itself in getUserWithProfile() — neither one
// alone is assumed sufficient; both check the real Supabase session/role,
// never anything supplied by the browser.
//
// If either Supabase env var is missing (e.g. this repo hasn't been wired
// to a project yet), the middleware safely no-ops instead of breaking the
// public website — this was verified with the production build running
// and no Supabase env vars set.
const PROTECTED_PREFIXES = ["/student", "/tutor", "/admin"] as const;

function roleHome(role: UserRole | undefined): string {
  if (role === "tutor") return "/tutor";
  if (role === "admin") return "/admin";
  return "/student";
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request: { headers: request.headers } });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const matchedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (matchedPrefix) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role comes from the database via the authenticated session — never
    // from a query param, cookie value, or anything else the client sent.
    // NOTE: .single<{ role: UserRole }>() — see the matching note in
    // lib/auth/actions.ts for why this explicit generic is required.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();

    const home = roleHome(profile?.role);
    if (`/${matchedPrefix.slice(1)}` !== home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and image optimization files so the middleware
     * only runs on actual page/route requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|logo.png).*)",
  ],
};
DIADEM_EOF

echo 'Writing components/Header.tsx'
mkdir -p 'components'
cat > 'components/Header.tsx' << 'DIADEM_EOF'
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone, MessageCircle, LogIn } from "lucide-react";
import { siteConfig, telHref, whatsappHref } from "@/lib/site-config";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100">
      <div className="container-px mx-auto flex h-20 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt={`${siteConfig.name} logo`}
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="leading-tight">
            <span className="block font-extrabold text-navy-800 text-lg tracking-tight">
              Diadem Consult
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-skyblue-600">
              Academy
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-navy-700 hover:text-skyblue-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-outline !px-4 !py-2.5 text-sm">
            <LogIn size={16} /> Log In
          </Link>
          <a href={telHref(siteConfig.contact.phones[0])} className="btn-outline !px-4 !py-2.5 text-sm">
            <Phone size={16} /> Call Us
          </a>
          <a href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")} className="btn-whatsapp !px-4 !py-2.5 text-sm">
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-navy-800 hover:bg-navy-50"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-navy-100 bg-white"
          >
            <nav className="flex flex-col gap-1 px-6 py-4">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-semibold text-navy-800 hover:bg-navy-50"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                  <LogIn size={18} /> Log In
                </Link>
                <a href={telHref(siteConfig.contact.phones[0])} className="btn-outline w-full">
                  <Phone size={18} /> Call {siteConfig.contact.phones[0]}
                </a>
                <a
                  href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")}
                  className="btn-whatsapp w-full"
                >
                  <MessageCircle size={18} /> Chat on WhatsApp
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
DIADEM_EOF

echo "All Phase 3 files written."
