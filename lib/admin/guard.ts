import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getUserWithProfile } from "@/lib/supabase/session";
import type { Profile } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Admin authorization.
//
// The role is read from the `profiles` row of the user that Supabase Auth has
// VERIFIED (getUserWithProfile -> auth.getUser()). It never comes from the URL,
// a form field, or any browser state.
//
//   requireAdmin()          for PAGES: redirects anyone who is not an admin.
//   authorizeAdminAction()  for SERVER ACTIONS: returns an error result.
//
// Server actions are public POST endpoints that can be called directly, so
// EVERY admin action must call authorizeAdminAction() itself. The database's
// RLS policies then enforce the same rule a second time.
// ---------------------------------------------------------------------------

/**
 * - signed out        -> /login
 * - student           -> /student
 * - tutor             -> /tutor
 * - anything else     -> /
 * - profile unreadable -> throws (app/admin/error.tsx shows a safe message)
 */
export async function requireAdmin(): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/admin");
  }
  if (!profile) {
    throw new Error("Admin profile could not be loaded.");
  }
  if (profile.role === "student") {
    redirect("/student");
  }
  if (profile.role === "tutor") {
    redirect("/tutor");
  }
  if (profile.role !== "admin") {
    redirect("/");
  }

  return { user, profile };
}

export type AdminAuth = { ok: true; userId: string } | { ok: false; error: string };

/** Generic messages only: never reveals whether an account or role exists. */
export async function authorizeAdminAction(): Promise<AdminAuth> {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, userId: user.id };
}

export type StaffAuth =
  | { ok: true; userId: string; role: "admin" | "tutor"; base: "/admin" | "/tutor" }
  | { ok: false; error: string };

/**
 * For actions that RLS already allows to BOTH tutors and admins (editing /
 * publishing courses, managing lessons). Students, signed-out users and
 * anyone else are refused. Admin-only actions keep using authorizeAdminAction().
 */
export async function authorizeStaffAction(): Promise<StaffAuth> {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  if (!profile || (profile.role !== "admin" && profile.role !== "tutor")) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return {
    ok: true,
    userId: user.id,
    role: profile.role,
    base: profile.role === "admin" ? "/admin" : "/tutor",
  };
}
