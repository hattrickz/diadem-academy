"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { authorizeAdminAction } from "@/lib/admin/guard";
import {
  parseCourseId,
  parseCourseInput,
  parsePublishedFlag,
  readText,
  type ActionState,
} from "@/lib/admin/course-validation";

// ---------------------------------------------------------------------------
// Admin course actions (create / update / publish / delete).
//
// SECURITY
//  * Server actions are public POST endpoints. Every action therefore starts
//    with authorizeAdminAction(), which re-reads the caller's role from the
//    database. Nothing about identity or role is taken from the form.
//  * Every id is validated as a uuid and every value is validated server-side.
//  * All queries use the signed-in user's session client (createClient), so the
//    database's RLS policies are an independent second layer. The service-role
//    key is never used.
//  * Writes use .select("id") so "RLS matched zero rows" becomes an error
//    instead of a false success.
//  * People only see messages written here, never raw database errors.
// ---------------------------------------------------------------------------

const NOT_FOUND_OR_DENIED = "That course wasn't found, or you don't have permission to change it.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function refreshViews() {
  revalidatePath("/admin", "layout"); // dashboard + course pages
  revalidatePath("/courses"); // public catalog
  revalidatePath("/student", "layout"); // enrolled students' pages
}

/** Maps a database error to a safe message; logs only code + message server-side. */
function dbMessage(action: string, error: PostgrestError): string {
  switch (error.code) {
    case "42501":
      return "You don't have permission to do that.";
    case "23514":
      return "Some values were rejected. Please check the highlighted fields.";
    default:
      console.error(`[admin-course:${action}]`, { code: error.code, message: error.message });
      return GENERIC_ERROR;
  }
}

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
    return { error: error ? dbMessage("create", error) : GENERIC_ERROR };
  }

  refreshViews();
  redirect(`/admin/courses/${data.id}?notice=created`);
}

export async function updateCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };

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
    return { error: dbMessage("update", error) };
  }
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshViews();
  return { success: "Course saved." };
}

export async function setCoursePublishedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };

  const courseId = parseCourseId(formData);
  const published = parsePublishedFlag(formData);
  if (!courseId || published === null) return { error: "That request wasn't valid." };

  const supabase = createClient();
  const { data, error } = await supabase.from("courses").update({ published }).eq("id", courseId).select("id");

  if (error) return { error: dbMessage("publish", error) };
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshViews();
  return { success: published ? "Course published." : "Course unpublished." };
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
  if (lookupError) return { error: dbMessage("delete:lookup", lookupError) };
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
  if (error) return { error: dbMessage("delete", error) };
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshViews();
  redirect("/admin/courses?notice=deleted");
}
