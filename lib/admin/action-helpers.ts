import "server-only";
import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";

// Small helpers shared by the admin course actions and the tutor lesson actions,
// so the error mapping and cache refresh exist in exactly one place.

export const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Re-render every page that shows course or lesson data (after a write). */
export function refreshCourseViews() {
  revalidatePath("/admin", "layout"); // admin dashboard + course pages
  revalidatePath("/tutor", "layout"); // tutor dashboard + course/lesson pages
  revalidatePath("/courses"); // public catalog
  revalidatePath("/student", "layout"); // enrolled students' pages
}

/**
 * Maps a database error to a safe message. Raw database errors are never shown
 * to people; unexpected ones are logged server-side (code + message only).
 */
export function dbErrorMessage(scope: string, error: PostgrestError): string {
  switch (error.code) {
    case "42501":
      return "You don't have permission to do that.";
    case "23514":
      return "Some values were rejected. Please check the highlighted fields.";
    default:
      console.error(`[${scope}]`, { code: error.code, message: error.message });
      return GENERIC_ERROR;
  }
}
