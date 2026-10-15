import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getUserWithProfile } from "@/lib/supabase/session";
import type { Profile } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Tutor PAGE guard. The role is read from the `profiles` row of the user that
// Supabase Auth has VERIFIED (getUserWithProfile -> auth.getUser()); it never
// comes from the URL, a form field or any browser state.
//
// middleware.ts already confines /tutor/* to tutors (admins are sent to /admin,
// where their own tools live); this is the independent server-side check every
// tutor page repeats, because layouts aren't re-run on client navigation.
//
// For SERVER ACTIONS use authorizeStaffAction() from lib/admin/guard.ts: it
// accepts tutors and admins (what RLS allows) and refuses everyone else.
// ---------------------------------------------------------------------------

/**
 * - signed out         -> /login
 * - student            -> /student
 * - admin              -> /admin (admins use the admin area)
 * - anything else      -> /
 * - profile unreadable -> throws (app/tutor/error.tsx shows a safe message)
 */
export async function requireTutor(): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/tutor");
  }
  if (!profile) {
    throw new Error("Tutor profile could not be loaded.");
  }
  if (profile.role === "student") {
    redirect("/student");
  }
  if (profile.role === "admin") {
    redirect("/admin");
  }
  if (profile.role !== "tutor") {
    redirect("/");
  }

  return { user, profile };
}
