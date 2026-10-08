import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { CourseSummary } from "@/lib/courses/data";

/**
 * Published courses for the PUBLIC catalog (/courses).
 *
 * Uses the cookie-less anonymous client AND filters on published = true, so
 * the result is the same for every visitor — a logged-in tutor/admin who
 * could otherwise see drafts through RLS never sees them here.
 *
 * Returns null when the catalog can't be loaded (missing config or a query
 * error) so the page can show a friendly message instead of crashing. The
 * underlying error is never passed to the page.
 */
export async function getPublishedCourses(): Promise<CourseSummary[] | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  // TYPING NOTE: see lib/courses/data.ts — explicit result type, typing only.
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, thumbnail_url")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .overrideTypes<CourseSummary[], { merge: false }>();

  if (error) return null;
  return data ?? [];
}
