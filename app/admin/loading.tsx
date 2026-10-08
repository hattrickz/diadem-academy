// Neutral placeholder blocks only; no invented numbers or names.
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="h-32 animate-pulse rounded-xl2 bg-navy-100/70" />
      <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-36 animate-pulse rounded-xl2 bg-navy-100/50" />
        <div className="h-36 animate-pulse rounded-xl2 bg-navy-100/50" />
        <div className="h-36 animate-pulse rounded-xl2 bg-navy-100/50" />
        <div className="h-36 animate-pulse rounded-xl2 bg-navy-100/50" />
      </div>
    </div>
  );
}
