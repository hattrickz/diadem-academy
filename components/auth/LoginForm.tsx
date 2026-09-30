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
