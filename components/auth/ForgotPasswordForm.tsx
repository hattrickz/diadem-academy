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
