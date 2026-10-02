// Small pure helpers for presenting a profile. No data access here.

/** First word of the full name, or null when there is no usable name. */
export function getFirstName(fullName: string | null | undefined): string | null {
    const first = fullName?.trim().split(/\s+/)[0];
    return first ? first : null;
}

function firstChar(value: string): string {
    return Array.from(value)[0] ?? "";
}

/** Up to two initials for the avatar circle, with a safe fallback. */
export function getInitials(
    fullName: string | null | undefined,
    email: string | null | undefined
): string {
    const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];

    if (parts.length >= 2) {
        return (firstChar(parts[0]) + firstChar(parts[parts.length - 1])).toUpperCase();
    }
    if (parts.length === 1) {
        return Array.from(parts[0]).slice(0, 2).join("").toUpperCase();
    }

    const fromEmail = email?.trim() ? firstChar(email.trim()) : "";
    return fromEmail ? fromEmail.toUpperCase() : "S";
}

/** Long date like "12 March 2026", or null if the value isn't a valid date. */
export function formatMemberSince(isoDate: string | null | undefined): string | null {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}