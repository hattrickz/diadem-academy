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
