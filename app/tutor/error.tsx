"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

// Error boundary for everything under /tutor. It ignores the error object on
// purpose, so raw database/Supabase messages never reach the screen.
export default function TutorError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-xl2 bg-white px-6 py-12 text-center shadow-sm ring-1 ring-navy-100"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-diadem-red/10 text-diadem-red">
        <AlertTriangle size={26} aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-navy-800">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-700/75">
        We couldn&apos;t load this page. Please try again. Nothing was changed.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
