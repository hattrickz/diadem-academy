// Shown while a /student page is being fetched. Neutral placeholder blocks
// only — no invented names, courses or numbers.
export default function StudentLoading() {
    return (
        <div role="status" aria-live="polite" className="space-y-8">
            <span className="sr-only">Loading your dashboard…</span>
            <div aria-hidden="true" className="h-36 animate-pulse rounded-xl2 bg-navy-100/70" />
            <div aria-hidden="true" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-56 animate-pulse rounded-xl2 bg-navy-100/50" />
                <div className="h-56 animate-pulse rounded-xl2 bg-navy-100/50" />
                <div className="h-56 animate-pulse rounded-xl2 bg-navy-100/50 md:col-span-2 lg:col-span-1" />
            </div>
        </div>
    );
}