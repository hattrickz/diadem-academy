import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getUserWithProfile } from "@/lib/supabase/session";
import type { Profile } from "@/lib/supabase/database.types";

/**
 * Server-only guard shared by every /student page.
 *
 * Same authorization rules the original /student page used, in one place:
 * the user comes from Supabase Auth and the role comes from the `profiles`
 * row — never from the URL, cookies we set ourselves, or any browser state.
 * Layouts are not re-run on client-side navigation, so each page calls this
 * itself rather than relying on app/student/layout.tsx.
 *
 * - No session            -> /login
 * - tutor / admin         -> their own dashboard (loop-safe)
 * - any other role value  -> /
 * - profile can't be read -> throws, which app/student/error.tsx renders as
 *   a friendly message. Nothing student-specific is rendered first, and the
 *   underlying error is never shown to the person.
 */
export async function requireStudent(
  returnPath: string
): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect(`/login?redirect=${returnPath}`);
  }

  if (!profile) {
    throw new Error("Student profile could not be loaded.");
  }

  if (profile.role === "tutor") {
    redirect("/tutor");
  }
  if (profile.role === "admin") {
    redirect("/admin");
  }
  if (profile.role !== "student") {
    redirect("/");
  }

  return { user, profile };
}