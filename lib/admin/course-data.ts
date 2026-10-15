import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { Course } from "@/lib/supabase/database.types";

// Read access for the admin course screens. Uses the signed-in user's session
// client (never the service-role key), so RLS applies behind requireAdmin().

export const COURSE_LIST_LIMIT = 200;

export interface DashboardStats {
  courses: number;
  published: number;
  drafts: number;
  students: number;
  enrollments: number;
  recentCourses: Pick<Course, "id" | "title" | "published" | "updated_at">[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const head = { count: "exact", head: true } as const;

  const [total, published, drafts, students, enrollments, recent] = await Promise.all([
    supabase.from("courses").select("id", head),
    supabase.from("courses").select("id", head).eq("published", true),
    supabase.from("courses").select("id", head).eq("published", false),
    supabase.from("profiles").select("id", head).eq("role", "student"),
    supabase.from("enrollments").select("id", head),
    supabase
      .from("courses")
      .select("id, title, published, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  for (const result of [total, published, drafts, students, enrollments, recent]) {
    if (result.error) throw new Error("Could not load dashboard statistics.");
  }

  return {
    courses: total.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    students: students.count ?? 0,
    enrollments: enrollments.count ?? 0,
    recentCourses: recent.data ?? [],
  };
}

export async function listAdminCourses(): Promise<{ courses: Course[]; truncated: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(COURSE_LIST_LIMIT);
  if (error) throw new Error("Could not load courses.");

  const courses = data ?? [];
  return { courses, truncated: courses.length >= COURSE_LIST_LIMIT };
}

/** One course (any publish state), or notFound() for a bad id / missing course. */
export async function getAdminCourse(courseId: string): Promise<Course> {
  if (!isUuid(courseId)) notFound();

  const supabase = createClient();
  const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (error) throw new Error("Could not load the course.");
  if (!data) notFound();
  return data;
}

/**
 * The REAL number of lessons and enrollments that deleting this course would
 * also delete (ON DELETE CASCADE). Shown on the delete panel; a failure here is
 * an error, never silently shown as zero.
 */
export async function getCourseDeletionImpact(
  courseId: string
): Promise<{ lessons: number; enrollments: number }> {
  const supabase = createClient();
  const head = { count: "exact", head: true } as const;

  const [lessons, enrollments] = await Promise.all([
    supabase.from("lessons").select("id", head).eq("course_id", courseId),
    supabase.from("enrollments").select("id", head).eq("course_id", courseId),
  ]);
  if (lessons.error || enrollments.error) {
    throw new Error("Could not count the course's lessons and enrollments.");
  }
  return { lessons: lessons.count ?? 0, enrollments: enrollments.count ?? 0 };
}
