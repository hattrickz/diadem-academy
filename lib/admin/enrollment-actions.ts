"use server";

import { createClient } from "@/lib/supabase/server";
import { authorizeAdminAction } from "@/lib/admin/guard";
import { dbErrorMessage, refreshCourseViews } from "@/lib/admin/action-helpers";
import { parseCourseId, readText, type ActionState } from "@/lib/admin/course-validation";

// ---------------------------------------------------------------------------
// Admin enrollment actions (enroll / remove).
//
// SECURITY
//  * ADMIN ONLY. Each action starts with authorizeAdminAction(), which re-reads
//    the caller's role from the database (server actions are public POST
//    endpoints). Tutors are refused: this is the admin-only guard, not the
//    tutor-or-admin one. Nothing about identity or role comes from the form.
//  * Ids are validated uuids. Before inserting, the student must really exist AND
//    have role 'student', and the course must really exist.
//  * Duplicates: the database's unique (student_id, course_id) constraint is the
//    authority; its error (23505) is turned into a friendly message.
//  * Removal takes ONLY an enrollment id (no student/course ids from the browser).
//    It uses .select("id") so "RLS matched zero rows" is an error, not a success.
//  * All queries use the signed-in admin's session client, so the Phase 5 RLS
//    ("Admins can manage all enrollments") is an independent second layer. The
//    service-role key is never used.
//  * People only see messages written here, never raw database errors.
// ---------------------------------------------------------------------------

// The generic uuid-field parser from the course validators is reused: it reads
// a named form field and returns it only if it is a valid uuid.
const uuidField = parseCourseId;

export async function enrollStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };

  const studentId = uuidField(formData, "studentId");
  const courseId = uuidField(formData, "courseId");
  const values = { studentId: readText(formData, "studentId"), courseId: readText(formData, "courseId") };

  const fieldErrors: Record<string, string> = {};
  if (!studentId) fieldErrors.studentId = "Choose a student.";
  if (!courseId) fieldErrors.courseId = "Choose a course.";
  if (!studentId || !courseId) {
    return { error: "Please choose both a student and a course.", fieldErrors, values };
  }

  const supabase = createClient();

  // Only STUDENT accounts can be enrolled (never a tutor or an admin).
  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", studentId)
    .maybeSingle();
  if (studentError) return { error: dbErrorMessage("enrollment:student", studentError) };
  if (!student || student.role !== "student") {
    return { error: "Choose a student account.", fieldErrors: { studentId: "Choose a student account." }, values };
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) return { error: dbErrorMessage("enrollment:course", courseError) };
  if (!course) {
    return { error: "That course wasn't found.", fieldErrors: { courseId: "That course wasn't found." }, values };
  }

  const { error } = await supabase.from("enrollments").insert({ student_id: studentId, course_id: courseId });
  if (error) {
    if (error.code === "23505") {
      return { error: "That student is already enrolled in this course.", values };
    }
    if (error.code === "23503") {
      return { error: "That student or course no longer exists.", values };
    }
    return { error: dbErrorMessage("enrollment:insert", error) };
  }

  refreshCourseViews();
  return { success: "Student enrolled." };
}

export async function unenrollStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return { error: auth.error };

  const enrollmentId = uuidField(formData, "enrollmentId");
  if (!enrollmentId) return { error: "That enrollment could not be identified." };

  const supabase = createClient();
  const { data, error } = await supabase.from("enrollments").delete().eq("id", enrollmentId).select("id");
  if (error) return { error: dbErrorMessage("enrollment:delete", error) };
  if (!data || data.length === 0) return { error: "That enrollment wasn't found. It may already have been removed." };

  refreshCourseViews();
  return { success: "Enrollment removed." };
}
