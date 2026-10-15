"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authorizeAdminAction, authorizeStaffAction } from "@/lib/admin/guard";
import { GENERIC_ERROR, dbErrorMessage, refreshCourseViews } from "@/lib/admin/action-helpers";
import {
  parseCourseId,
  parseCourseInput,
  parsePublishedFlag,
  readText,
  type ActionState,
} from "@/lib/admin/course-validation";

// ---------------------------------------------------------------------------
// Course actions (create / update / publish / delete).
//
// SECURITY
//  * Server actions are public POST endpoints. Every action therefore starts
//    with a guard that re-reads the caller's role from the database. Nothing
//    about identity or role is taken from the form.
//  * create + delete (and the original update/publish) use authorizeAdminAction().
//    ONLY the two *AsTutorAction entry points use authorizeStaffAction(), because
//    RLS already lets tutors update/publish courses; they share the same core.
//  * Every id is validated as a uuid and every value is validated server-side.
//  * All queries use the signed-in user's session client (createClient), so the
//    database's RLS policies are an independent second layer. The service-role
//    key is never used.
//  * Writes use .select("id") so "RLS matched zero rows" becomes an error
//    instead of a false success.
//  * People only see messages written here, never raw database errors.
// ---------------------------------------------------------------------------

const NOT_FOUND_OR_DENIED = "That course wasn't found, or you don't have permission to change it.";

function echo(formData: FormData, published: boolean): Record<string, string> {
  return {
    title: readText(formData, "title"),
    slug: readText(formData, "slug"),
    description: readText(formData, "description"),
    thumbnail_url: readText(formData, "thumbnail_url"),
    published: published ? "on" : "",
  };
}

export async function createCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };

  const parsed = parseCourseInput(formData);
  if (!parsed.ok) {
    return { error: "Please correct the highlighted fields.", fieldErrors: parsed.fieldErrors, values: parsed.values };
  }
  const { slugWasGenerated, ...course } = parsed.value;

  const supabase = createClient();
  const { data, error } = await supabase.from("courses").insert(course).select("id").single();

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        error: "A course with that URL slug already exists.",
        fieldErrors: {
          slug: slugWasGenerated
            ? "A course with this title's slug already exists. Enter a different slug."
            : "That slug is already used by another course.",
        },
        values: echo(formData, course.published),
      };
    }
    return { error: error ? dbErrorMessage("admin-course:create", error) : GENERIC_ERROR };
  }

  refreshCourseViews();
  redirect(`/admin/courses/${data.id}?notice=created`);
}

// Shared by the admin and tutor entry points below. The CALLER has already
// authorized the user; the database's RLS then enforces the same rule again.
async function performCourseUpdate(formData: FormData): Promise<ActionState> {
  const courseId = parseCourseId(formData);
  if (!courseId) return { error: "That course could not be identified." };

  const parsed = parseCourseInput(formData);
  if (!parsed.ok) {
    return { error: "Please correct the highlighted fields.", fieldErrors: parsed.fieldErrors, values: parsed.values };
  }
  const { slugWasGenerated, ...course } = parsed.value;
  void slugWasGenerated;

  const supabase = createClient();
  const { data, error } = await supabase.from("courses").update(course).eq("id", courseId).select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        error: "That URL slug is already used by another course.",
        fieldErrors: { slug: "That slug is already used by another course." },
        values: echo(formData, course.published),
      };
    }
    return { error: dbErrorMessage("admin-course:update", error) };
  }
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshCourseViews();
  return { success: "Course saved." };
}

async function performCoursePublish(formData: FormData): Promise<ActionState> {
  const courseId = parseCourseId(formData);
  const published = parsePublishedFlag(formData);
  if (!courseId || published === null) return { error: "That request wasn't valid." };

  const supabase = createClient();
  const { data, error } = await supabase.from("courses").update({ published }).eq("id", courseId).select("id");

  if (error) return { error: dbErrorMessage("admin-course:publish", error) };
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshCourseViews();
  return { success: published ? "Course published." : "Course unpublished." };
}

export async function updateCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };
  return performCourseUpdate(formData);
}

/**
 * Tutor entry point. RLS lets tutors AND admins update courses, so this
 * authorizes either role; students and signed-out users are refused. It does
 * NOT widen the admin-only actions (create / delete), which are unchanged.
 */
export async function updateCourseAsTutorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeStaffAction();
  if (!auth.ok) return { error: auth.error };
  return performCourseUpdate(formData);
}

export async function setCoursePublishedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };
  return performCoursePublish(formData);
}

/** Tutor entry point for publish / unpublish (RLS permits tutors and admins). */
export async function setCoursePublishedAsTutorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeStaffAction();
  if (!auth.ok) return { error: auth.error };
  return performCoursePublish(formData);
}

export async function deleteCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };

  const courseId = parseCourseId(formData);
  if (!courseId) return { error: "That course could not be identified." };
  const typedTitle = readText(formData, "confirmTitle").trim();

  const supabase = createClient();
  const { data: course, error: lookupError } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .maybeSingle();
  if (lookupError) return { error: dbErrorMessage("admin-course:delete:lookup", lookupError) };
  if (!course) return { error: NOT_FOUND_OR_DENIED };

  // The REAL title (from the database) must be typed exactly, so a stray click
  // or a tampered form can't delete a course.
  if (typedTitle !== course.title.trim()) {
    return {
      error: "The title you typed doesn't match, so nothing was deleted.",
      fieldErrors: { confirmTitle: "Type the course title exactly to confirm." },
    };
  }

  // Deleting a course also deletes its lessons and enrollments (ON DELETE
  // CASCADE). The page shows the real counts before this is reachable.
  const { data, error } = await supabase.from("courses").delete().eq("id", courseId).select("id");
  if (error) return { error: dbErrorMessage("admin-course:delete", error) };
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshCourseViews();
  redirect("/admin/courses?notice=deleted");
}
