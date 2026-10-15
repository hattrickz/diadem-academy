// Route parameters come straight from the URL, so they are untrusted input.
// Validating the shape first means a malformed id becomes an ordinary "not
// found" instead of reaching Postgres as an invalid uuid.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
