"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "btn-primary",
  outline: "btn-outline",
  danger: "btn !bg-diadem-red !text-white hover:!bg-diadem-red/90",
} as const;

// Submit button with a pending state. `compact` keeps a 44px touch target with
// tighter padding for use in lists and headers.
export default function AdminSubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  compact = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof VARIANTS;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${VARIANTS[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "min-h-[44px] !px-4 !py-2.5 text-sm" : ""
      }`}
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
