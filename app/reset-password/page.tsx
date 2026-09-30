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
