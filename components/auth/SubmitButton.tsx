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
