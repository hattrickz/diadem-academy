import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cookie-less, anonymous Supabase client for PUBLIC pages (e.g. /courses).
 *
 * It never carries a user session, so a public page always sees exactly what
 * an anonymous visitor would — even if the person browsing happens to be
 * logged in as a tutor or admin. Uses only the public URL + anon key; the
 * service-role key is never referenced here.
 *
 * Returns null when the env vars are missing so a public page can degrade
 * gracefully instead of crashing.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createSupabaseClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      // Next.js 14 stores server-side fetch() results in its Data Cache. This
      // client reads data that changes the moment a course is published or
      // unpublished, so every request must reach the database — otherwise an
      // unpublished course would stay publicly listed until the cache expired.
      // (The signed-in student pages don't need this: reading the session
      // cookies already opts their queries out of that cache.)
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

