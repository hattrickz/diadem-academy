import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { listAdminCourses } from "@/lib/admin/course-data";
import {
  ENROLLMENT_LIST_LIMIT,
  STUDENT_PICKER_LIMIT,
  listEnrollments,
  listStudentOptions,
} from "@/lib/admin/enrollment-data";
import { formatMemberSince } from "@/lib/profile-display";
import { isUuid } from "@/lib/uuid";
import EnrollStudentForm from "@/components/admin/EnrollStudentForm";
import UnenrollForm from "@/components/admin/UnenrollForm";
import EmptyState from "@/components/dashboard/student/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Enrollments",
  robots: { index: false, follow: false },
};

// profiles.email is editable by the student, so the account-id suffix is shown
// to tell look-alike accounts apart.
const studentLabel = (s: { id: string; full_name: string | null; email: string | null }) =>
  `${s.full_name?.trim() || "Unnamed student"} — ${s.email || "no email"} (…${s.id.slice(-4)})`;

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: { course?: string | string[] };
}) {
  // Admin only: tutors and students are redirected away by requireAdmin().
  await requireAdmin();

  // Optional filter from the query string: validated, never trusted.
  const requested = typeof searchParams.course === "string" && isUuid(searchParams.course) ? searchParams.course : undefined;

  const [{ courses }, { students, truncated: studentsTruncated }] = await Promise.all([
    listAdminCourses(),
    listStudentOptions(),
  ]);
  const activeFilter = requested && courses.some((c) => c.id === requested) ? requested : "";
  const { rows, truncated } = await listEnrollments(activeFilter || undefined);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">Enrollments</h1>

      <section aria-labelledby="enroll-heading" className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-8">
        <h2 id="enroll-heading" className="mb-5 flex items-center gap-2 text-lg font-bold text-navy-800">
          <UserPlus size={18} aria-hidden="true" /> Enroll a student
        </h2>

        {courses.length === 0 ? (
          <p className="text-sm text-navy-700/80">
            There are no courses yet.{" "}
            <Link href="/admin/courses/new" className="font-semibold text-skyblue-700 hover:text-skyblue-800">
              Create a course
            </Link>{" "}
            first, then you can enroll students in it.
          </p>
        ) : students.length === 0 ? (
          <p className="text-sm text-navy-700/80">
            There are no student accounts yet. Students appear here after they sign up.
          </p>
        ) : (
          <>
            <EnrollStudentForm
              students={students.map((s) => ({ value: s.id, label: studentLabel(s) }))}
              courses={courses.map((c) => ({ value: c.id, label: c.published ? c.title : `${c.title} (draft)` }))}
              defaultCourseId={activeFilter}
            />
            {studentsTruncated && (
              <p className="mt-3 text-xs text-navy-700/70">Showing the first {STUDENT_PICKER_LIMIT} students.</p>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="list-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="list-heading" className="flex items-center gap-2 text-lg font-bold text-navy-800">
            <Users size={18} aria-hidden="true" /> Current enrollments
            <span className="text-sm font-medium text-navy-700/70">({rows.length})</span>
          </h2>

          {/* Plain GET form: filtering needs no JavaScript and changes no data. */}
          {courses.length > 0 && (
            <form method="get" className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
              <div className="w-full min-w-0 sm:w-auto">
                <label htmlFor="course-filter" className="mb-1 block text-xs font-semibold text-navy-800">
                  Filter by course
                </label>
                <select
                  id="course-filter"
                  name="course"
                  defaultValue={activeFilter}
                  className="min-h-[44px] w-full max-w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-sm text-navy-800 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200 sm:w-72"
                >
                  <option value="">All courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-outline min-h-[44px] !px-4 !py-2.5 text-sm">
                Apply
              </button>
              {activeFilter && (
                <Link
                  href="/admin/enrollments"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-skyblue-700"
                >
                  Clear
                </Link>
              )}
            </form>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No enrollments yet"
            description={activeFilter ? "No students are enrolled in this course." : "Students you enroll will appear here."}
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((e) => {
              const name = e.student?.full_name?.trim();
              const label = name || e.student?.email || "Unknown student";
              return (
                <li key={e.id} className="rounded-xl2 bg-white p-4 shadow-sm ring-1 ring-navy-100 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-800 [overflow-wrap:anywhere]">{label}</p>
                      {name && e.student?.email && (
                        <p className="text-sm text-navy-700/75 [overflow-wrap:anywhere]">{e.student.email}</p>
                      )}
                      <p className="mt-1 text-sm text-navy-700/80 [overflow-wrap:anywhere]">
                        {e.course ? (
                          <Link
                            href={`/admin/courses/${e.course.id}`}
                            className="font-semibold text-skyblue-700 hover:text-skyblue-800"
                          >
                            {e.course.title}
                          </Link>
                        ) : (
                          "Unknown course"
                        )}
                        {e.course && !e.course.published && " (draft)"} · Enrolled {formatMemberSince(e.created_at) ?? "—"}
                      </p>
                    </div>
                    <UnenrollForm enrollmentId={e.id} studentLabel={label} courseTitle={e.course?.title ?? "this course"} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {truncated && (
          <p className="text-sm text-navy-700/75">Showing the newest {ENROLLMENT_LIST_LIMIT} enrollments.</p>
        )}
      </section>
    </div>
  );
}
