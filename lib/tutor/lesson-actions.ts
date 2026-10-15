"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authorizeStaffAction } from "@/lib/admin/guard";
import { GENERIC_ERROR, dbErrorMessage, refreshCourseViews } from "@/lib/admin/action-helpers";
import { parsePublishedFlag, type ActionState } from "@/lib/admin/course-validation";
import { parseDirection, parseLessonInput, parseUuidField } from "@/lib/tutor/lesson-validation";

// ---------------------------------------------------------------------------
// Lesson actions (create / update / publish / reorder).
//
// SECURITY
//  * Server actions are public POST endpoints, so each one starts with
//    authorizeStaffAction(): it re-reads the caller's role from the database and
//    accepts only tutors and admins (what the Phase 5 RLS allows). Students and
//    signed-out users are refused. No role or identity is read from the form.
//  * courseId and lessonId are validated uuids, and EVERY lesson query matches on
//    BOTH ids (.eq("id", lessonId).eq("course_id", courseId)): a lesson can never
//    be touched through another course's id, and course_id is never part of an
//    update, so a lesson can't be moved between courses.
//  * All queries use the signed-in user's session client, so RLS is an
//    independent second layer. The service-role key is never used.
//  * Writes use .select("id") so "RLS matched zero rows" is an error, not a
//    false success.
//  * People only see messages written here, never raw database errors.
//
// ORDERING: `position` is not unique in the database (so reordering can't hit a
// constraint). After any reorder the whole course is renumbered 1..n in a
// deterministic order (position, created_at, id), so positions end up unique and
// contiguous. The updates are separate statements, so a failure midway can leave
// a valid-but-unintended order; it is reported, never hidden.
// ---------------------------------------------------------------------------

const NOT_FOUND_OR_DENIED = "That lesson wasn't found, or you don't have permission to change it.";

type Db = ReturnType<typeof createClient>;

async function loadOrder(supabase: Db, courseId: string) {
  return supabase
    .from("lessons")
    .select("id, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
}

/** Moves `id` to `targetIndex` (0-based, clamped) inside `order`; returns the new order. */
function placeAt(order: string[], id: string, targetIndex: number): string[] {
  const next = order.filter((x) => x !== id);
  next.splice(Math.min(Math.max(targetIndex, 0), next.length), 0, id);
  return next;
}

/** Writes positions 1..n for `order`, touching only lessons whose value changes. Returns an error message or null. */
async function renumber(
  supabase: Db,
  courseId: string,
  order: string[],
  current: Map<string, number>
): Promise<string | null> {
  for (let i = 0; i < order.length; i++) {
    const wanted = i + 1;
    if (current.get(order[i]) === wanted) continue;
    const { data, error } = await supabase
      .from("lessons")
      .update({ position: wanted })
      .eq("id", order[i])
      .eq("course_id", courseId) // relationship enforced in the query itself
      .select("id");
    if (error) return dbErrorMessage("tutor-lesson:renumber", error);
    if (!data || data.length === 0) return NOT_FOUND_OR_DENIED;
  }
  return null;
}

export async function createLessonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeStaffAction();
  if (!auth.ok) return { error: auth.error };

  const courseId = parseUuidField(formData, "courseId");
  if (!courseId) return { error: "That course could not be identified." };

  const parsed = parseLessonInput(formData);
  if (!parsed.ok) {
    return { error: "Please correct the highlighted fields.", fieldErrors: parsed.fieldErrors, values: parsed.values };
  }
  const { position: wantedPosition, ...fields } = parsed.value;

  const supabase = createClient();

  // The parent course must exist and be visible to this user.
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) return { error: dbErrorMessage("tutor-lesson:course", courseError) };
  if (!course) return { error: "That course wasn't found." };

  // Always append first; an explicit position is applied afterwards.
  const { data: last, error: lastError } = await supabase
    .from("lessons")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1);
  if (lastError) return { error: dbErrorMessage("tutor-lesson:last", lastError) };
  const endPosition = (last?.[0]?.position ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("lessons")
    .insert({ ...fields, course_id: courseId, position: endPosition })
    .select("id")
    .single();
  if (error || !created) return { error: error ? dbErrorMessage("tutor-lesson:create", error) : GENERIC_ERROR };

  let notice = "lesson-created";
  if (wantedPosition !== null) {
    const { data: rows, error: orderError } = await loadOrder(supabase, courseId);
    if (orderError || !rows) {
      notice = "lesson-created-reorder-failed";
    } else {
      const order = placeAt(rows.map((r) => r.id), created.id, wantedPosition - 1);
      const failure = await renumber(supabase, courseId, order, new Map(rows.map((r) => [r.id, r.position])));
      if (failure) notice = "lesson-created-reorder-failed";
    }
  }

  refreshCourseViews();
  redirect(`${auth.base}/courses/${courseId}?notice=${notice}`);
}

export async function updateLessonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeStaffAction();
  if (!auth.ok) return { error: auth.error };

  const courseId = parseUuidField(formData, "courseId");
  const lessonId = parseUuidField(formData, "lessonId");
  if (!courseId || !lessonId) return { error: "That lesson could not be identified." };

  const parsed = parseLessonInput(formData);
  if (!parsed.ok) {
    return { error: "Please correct the highlighted fields.", fieldErrors: parsed.fieldErrors, values: parsed.values };
  }
  const { position: wantedPosition, ...fields } = parsed.value;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update(fields) // course_id and position are NOT part of this update
    .eq("id", lessonId)
    .eq("course_id", courseId) // the lesson must belong to this course
    .select("id");
  if (error) return { error: dbErrorMessage("tutor-lesson:update", error) };
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  if (wantedPosition !== null) {
    const { data: rows, error: orderError } = await loadOrder(supabase, courseId);
    if (orderError || !rows) return { error: "Lesson saved, but its order couldn't be checked. Please try again." };

    const current = rows.map((r) => r.id);
    const from = current.indexOf(lessonId);
    const target = Math.min(Math.max(wantedPosition - 1, 0), current.length - 1);
    if (from !== -1 && from !== target) {
      const failure = await renumber(
        supabase,
        courseId,
        placeAt(current, lessonId, target),
        new Map(rows.map((r) => [r.id, r.position]))
      );
      if (failure) return { error: `Lesson saved, but its order couldn't be changed. ${failure}` };
    }
  }

  refreshCourseViews();
  return { success: "Lesson saved." };
}

export async function setLessonPublishedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeStaffAction();
  if (!auth.ok) return { error: auth.error };

  const courseId = parseUuidField(formData, "courseId");
  const lessonId = parseUuidField(formData, "lessonId");
  const published = parsePublishedFlag(formData);
  if (!courseId || !lessonId || published === null) return { error: "That request wasn't valid." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update({ published })
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .select("id");
  if (error) return { error: dbErrorMessage("tutor-lesson:publish", error) };
  if (!data || data.length === 0) return { error: NOT_FOUND_OR_DENIED };

  refreshCourseViews();
  return { success: published ? "Lesson published." : "Lesson unpublished." };
}

export async function moveLessonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeStaffAction();
  if (!auth.ok) return { error: auth.error };

  const courseId = parseUuidField(formData, "courseId");
  const lessonId = parseUuidField(formData, "lessonId");
  const direction = parseDirection(formData);
  if (!courseId || !lessonId || !direction) return { error: "That request wasn't valid." };

  const supabase = createClient();
  const { data: rows, error } = await loadOrder(supabase, courseId);
  if (error) return { error: dbErrorMessage("tutor-lesson:move:list", error) };

  const ids = (rows ?? []).map((r) => r.id);
  const index = ids.indexOf(lessonId); // must be one of THIS course's lessons
  if (index === -1) return { error: NOT_FOUND_OR_DENIED };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) {
    return { success: direction === "up" ? "Already the first lesson." : "Already the last lesson." };
  }

  const failure = await renumber(
    supabase,
    courseId,
    placeAt(ids, lessonId, target),
    new Map((rows ?? []).map((r) => [r.id, r.position]))
  );
  if (failure) return { error: failure };

  refreshCourseViews();
  return { success: "Lesson order updated." };
}
