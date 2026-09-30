// Small, dependency-free validation helpers shared by every auth form.
// Client-side checks here are for immediate UX feedback only — the server
// actions in lib/auth/actions.ts re-validate everything and are the
// authoritative check.

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sensible-but-not-punishing password rule: at least 8 characters, with at
 * least one letter and one number. Returns null when valid, or a
 * human-readable reason when not.
 */
export function passwordIssue(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
