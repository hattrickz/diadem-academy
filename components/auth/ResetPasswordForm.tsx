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
