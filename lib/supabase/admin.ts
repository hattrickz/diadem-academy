import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// PRIVILEGED client — bypasses Row Level Security entirely.
//
// The `server-only` import above makes Next.js throw a BUILD ERROR if this
// file is ever imported from a Client Component, so the service-role key
// cannot accidentally end up in a browser bundle.
//
// Use this ONLY for trusted, server-side, admin-style operations, e.g.
// changing a user's role from an authenticated-admin Server Action or Route
// Handler that has already verified the caller is an admin. Never call this
// based on unverified client input.
//
// SUPABASE_SERVICE_ROLE_KEY must NOT have a NEXT_PUBLIC_ prefix and must
// only ever live in server environment variables (.env.local locally, and
// your hosting provider's encrypted secret store in production).

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "This client must only be used server-side (see docs/BACKEND.md)."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
