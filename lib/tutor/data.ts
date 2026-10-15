import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { Course, Lesson } from "@/lib/supabase/database.types";

// Read access for the tutor screens. Uses the signed-in user's session client
// (never the service-role key), so RLS applies behind requireTutor(). Course
// reads are reused from lib/admin/course-data.ts (listAdminCourses / getAdminCourse).

export interface TutorDashboardStats {
  courses: { total: number; published: number; drafts: number };
  lessons: { total: number; published: number; drafts: number };
  recentCourses: Pick<Course, "id" | "title" | "published" | "updated_at">[];
  recentLessons: (Pick<Lesson, "id" | "course_id" | "title" | "published" | "updated_at"> & {
    courseTitle: string | null;
  })[];
}

export async function getTutorDashboardStats(): Promise<TutorDashboardStats> {
  const supabase = createClient();
  const head = { count: "exact", head: true } as const;

  const [courses, pubCourses, draftCourses, lessons, pubLessons, draftLessons, recentCourses, recentLessons] =
    await Promise.all([
      supabase.from("courses").select("id", head),
      supabase.from("courses").select("id", head).eq("published", true),
      supabase.from("courses").select("id", head).eq("published", false),
      supabase.from("lessons").select("id", head),
      supabase.from("lessons").select("id", head).eq("published", true),
      supabase.from("lessons").select("id", head).eq("published", false),
      supabase
        .from("courses")
        .select("id, title, published, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("lessons")
        .select("id, course_id, title, published, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  for (const result of [courses, pubCourses, draftCourses, lessons, pubLessons, draftLessons, recentCourses, recentLessons]) {
    if (result.error) throw new Error("Could not load dashboard statistics.");
  }

  // Attach each recent lesson's course title (one extra query, only if needed).
  const lessonRows = recentLessons.data ?? [];
  const titleById = new Map<string, string>();
  if (lessonRows.length > 0) {
    const ids = Array.from(new Set(lessonRows.map((l) => l.course_id)));
    const { data, error } = await supabase.from("courses").select("id, title").in("id", ids);
    if (error) throw new Error("Could not load dashboard statistics.");
    for (const c of data ?? []) titleById.set(c.id, c.title);
  }

  return {
    courses: { total: courses.count ?? 0, published: pubCourses.count ?? 0, drafts: draftCourses.count ?? 0 },
    lessons: { total: lessons.count ?? 0, published: pubLessons.count ?? 0, drafts: draftLessons.count ?? 0 },
    recentCourses: recentCourses.data ?? [],
    recentLessons: lessonRows.map((l) => ({ ...l, courseTitle: titleById.get(l.course_id) ?? null })),
  };
}

/** All lessons of a course (any publish state) in a deterministic order. */
export async function listCourseLessons(courseId: string): Promise<Lesson[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error("Could not load lessons.");
  return data ?? [];
}

/**
 * One lesson, but ONLY if it belongs to the given course (matched on BOTH ids),
 * so a lesson id from another course in the URL is simply "not found".
 */
export async function getCourseLesson(courseId: string, lessonId: string): Promise<Lesson> {
  if (!isUuid(courseId) || !isUuid(lessonId)) notFound();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw new Error("Could not load the lesson.");
  if (!data) notFound();
  return data;
}
