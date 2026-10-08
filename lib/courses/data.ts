import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { Course, Enrollment, Lesson } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Student-facing course data access.
//
// SECURITY MODEL — two independent layers:
//   1. Database RLS (see the Phase 5 migration) only returns courses that are
//      published and lessons that are published AND belong to a course the
//      signed-in student is enrolled in.
//   2. These helpers ALSO check enrollment explicitly, using the user id the
//      caller got from Supabase Auth (requireStudent) — never a value from
//      the URL — and always filter on published = true.
//
// "Not enrolled", "course does not exist", "course unpublished" and "malformed
// id" all produce the SAME notFound() result, so the URL cannot be used to
// discover which courses exist.
// ---------------------------------------------------------------------------

export type CourseSummary = Pick<Course, "id" | "title" | "slug" | "description" | "thumbnail_url">;
export type LessonSummary = Pick<Lesson, "id" | "title" | "description" | "position">;
export type LessonDetail = Pick<
  Lesson,
  "id" | "course_id" | "title" | "description" | "video_url" | "pdf_url" | "position"
>;

const COURSE_COLUMNS = "id, title, slug, description, thumbnail_url";
const LESSON_SUMMARY_COLUMNS = "id, title, description, position";
const LESSON_DETAIL_COLUMNS = "id, course_id, title, description, video_url, pdf_url, position";

// TYPING NOTE: with @supabase/supabase-js 2.115 and this project's hand-written
// Database types, column-list selects resolve to `never` (the same upstream
// inference edge case documented in lib/auth/actions.ts for profiles). The
// result types are therefore stated explicitly with overrideTypes<…> /
// maybeSingle<…>. This affects typing only, not behavior or security.

/** The signed-in student's own enrolled courses, newest enrollment first. */
export async function getEnrolledCourses(userId: string): Promise<CourseSummary[]> {
  const supabase = createClient();

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id, created_at")
    .eq("student_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<Pick<Enrollment, "course_id" | "created_at">[], { merge: false }>();

  if (enrollmentError) {
    console.error("GET ENROLLMENTS ERROR:", {
      message: enrollmentError.message,
      details: enrollmentError.details,
      hint: enrollmentError.hint,
      code: enrollmentError.code,
    });

    throw new Error("Could not load enrollments.");
  }
  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const courseIds = enrollments.map((e) => e.course_id);

  const { data: courses, error: courseError } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .in("id", courseIds)
    .eq("published", true)
    .overrideTypes<CourseSummary[], { merge: false }>();

  if (courseError) {
    throw new Error("Could not load courses.");
  }

  // Keep the enrollment order. An enrollment whose course is unpublished (or
  // no longer visible) simply doesn't appear.
  const byId = new Map((courses ?? []).map((c) => [c.id, c]));
  return courseIds.flatMap((id) => {
    const course = byId.get(id);
    return course ? [course] : [];
  });
}

/**
 * Returns the course ONLY if the given student is enrolled in it and it is
 * published. Otherwise calls notFound(). Every course/lesson page goes
 * through this function.
 */
export async function requireEnrolledCourse(
  courseId: string,
  userId: string
): Promise<CourseSummary> {
  if (!isUuid(courseId)) notFound();

  const supabase = createClient();

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .maybeSingle<Pick<Enrollment, "id">>();

  if (enrollmentError) {
    throw new Error("Could not verify enrollment.");
  }
  if (!enrollment) notFound();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", courseId)
    .eq("published", true)
    .maybeSingle<CourseSummary>();

  if (courseError) {
    throw new Error("Could not load the course.");
  }
  if (!course) notFound();

  return course;
}

/**
 * Published lessons of a course, in display order. Call only AFTER
 * requireEnrolledCourse() has succeeded for the same course.
 */
export async function getPublishedLessons(courseId: string): Promise<LessonSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_SUMMARY_COLUMNS)
    .eq("course_id", courseId)
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .overrideTypes<LessonSummary[], { merge: false }>();

  if (error) {
    throw new Error("Could not load lessons.");
  }
  return data ?? [];
}

/**
 * One published lesson, but ONLY if it belongs to the given course (so a
 * lesson id from another course can't be smuggled in through the URL).
 * Otherwise calls notFound(). Call only AFTER requireEnrolledCourse().
 */
export async function requirePublishedLesson(
  courseId: string,
  lessonId: string
): Promise<LessonDetail> {
  if (!isUuid(lessonId)) notFound();

  const supabase = createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_DETAIL_COLUMNS)
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .eq("published", true)
    .maybeSingle<LessonDetail>();

  if (error) {
    throw new Error("Could not load the lesson.");
  }
  if (!data) notFound();

  return data;
}
