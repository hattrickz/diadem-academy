import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Course, Profile } from "@/lib/supabase/database.types";

// Read access for the admin enrollment screen. Uses the signed-in admin's
// session client (never the service-role key), so RLS applies behind
// requireAdmin(): only admins can read the enrollments table at all, and only
// admins can read other people's profiles.

export const ENROLLMENT_LIST_LIMIT = 200;
export const STUDENT_PICKER_LIMIT = 500;

export type StudentOption = Pick<Profile, "id" | "full_name" | "email">;

export interface EnrollmentRow {
  id: string;
  created_at: string;
  student: StudentOption | null;
  course: Pick<Course, "id" | "title" | "published"> | null;
}

/** Newest enrollments first, optionally for one course (the id must already be validated). */
export async function listEnrollments(courseId?: string): Promise<{ rows: EnrollmentRow[]; truncated: boolean }> {
  const supabase = createClient();

  let query = supabase
    .from("enrollments")
    .select("id, student_id, course_id, created_at")
    .order("created_at", { ascending: false })
    .limit(ENROLLMENT_LIST_LIMIT);
  if (courseId) {
    query = query.eq("course_id", courseId);
  }
  const { data, error } = await query;
  if (error) throw new Error("Could not load enrollments.");

  const enrollments = data ?? [];
  if (enrollments.length === 0) return { rows: [], truncated: false };

  const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)));
  const courseIds = Array.from(new Set(enrollments.map((e) => e.course_id)));

  const [students, courses] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").in("id", studentIds),
    supabase.from("courses").select("id, title, published").in("id", courseIds),
  ]);
  if (students.error || courses.error) throw new Error("Could not load enrollment details.");

  const studentById = new Map((students.data ?? []).map((s) => [s.id, s]));
  const courseById = new Map((courses.data ?? []).map((c) => [c.id, c]));

  return {
    rows: enrollments.map((e) => ({
      id: e.id,
      created_at: e.created_at,
      student: studentById.get(e.student_id) ?? null,
      course: courseById.get(e.course_id) ?? null,
    })),
    truncated: enrollments.length >= ENROLLMENT_LIST_LIMIT,
  };
}

/** Real student accounts only (role = 'student'): tutors and admins are never offered. */
export async function listStudentOptions(): Promise<{ students: StudentOption[]; truncated: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "student")
    .order("full_name", { ascending: true })
    .limit(STUDENT_PICKER_LIMIT);
  if (error) throw new Error("Could not load students.");

  const students = data ?? [];
  return { students, truncated: students.length >= STUDENT_PICKER_LIMIT };
}
