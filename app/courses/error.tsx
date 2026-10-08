"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

// Error boundary for /courses. Ignores the error object on purpose so raw
// database messages never reach a visitor.
export default function CoursesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh]">
      <div className="container-px mx-auto max-w-xl">
        <div
          role="alert"
          className="flex flex-col items-center rounded-xl2 bg-white px-6 py-12 text-center shadow-sm ring-1 ring-navy-100"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-diadem-red/10 text-diadem-red">
            <AlertTriangle size={26} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-navy-800">We couldn&apos;t load the courses</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-700/75">
            Something went wrong on our side. Please try again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => reset()} className="btn-primary">
              Try again
            </button>
            <Link href="/contact" className="btn-outline">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
