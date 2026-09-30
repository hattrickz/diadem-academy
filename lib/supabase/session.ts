import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";

/**
 * Server-only helper for Server Components / Server Actions.
 *
 * Retrieves the authenticated user directly from Supabase Auth (never from
 * a client-supplied value) and their `profiles` row — which is where the
 * authoritative `role` lives. Every protected page should call this itself
 * rather than trusting anything passed from the browser, as defense in
 * depth alongside middleware.ts.
 */
export async function getUserWithProfile(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  // NOTE: .single<Profile>() explicitly types this query's result.
  // See the matching note in lib/auth/actions.ts for why this is needed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile: profile ?? null };
}
