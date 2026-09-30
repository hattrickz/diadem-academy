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
