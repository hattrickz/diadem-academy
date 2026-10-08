// Neutral placeholder blocks only — no invented course names.
export default function CoursesLoading() {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh]">
      <div role="status" aria-live="polite" className="container-px mx-auto max-w-6xl">
        <span className="sr-only">Loading courses…</span>
        <div aria-hidden="true" className="h-8 w-48 animate-pulse rounded bg-navy-100/70" />
        <div aria-hidden="true" className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-navy-100/50" />
        <div aria-hidden="true" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-xl2 bg-navy-100/50" />
          <div className="h-72 animate-pulse rounded-xl2 bg-navy-100/50" />
          <div className="h-72 animate-pulse rounded-xl2 bg-navy-100/50" />
        </div>
      </div>
    </section>
  );
}
