import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { COURSE_LIST_LIMIT, listAdminCourses } from "@/lib/admin/course-data";
import { formatMemberSince } from "@/lib/profile-display";
import StatusBadge from "@/components/admin/StatusBadge";
import CoursePublishToggle from "@/components/admin/CoursePublishToggle";
import EmptyState from "@/components/dashboard/student/EmptyState";
import FormMessage from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Courses",
  robots: { index: false, follow: false },
};

// The ?notice= value is only ever used as a KEY into this fixed list; arbitrary
// text from the URL is never rendered.
const NOTICES: Record<string, string> = { deleted: "Course deleted." };

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { notice?: string | string[] };
}) {
  await requireAdmin();
  const { courses, truncated } = await listAdminCourses();
  const notice =
    typeof searchParams.notice === "string" && Object.prototype.hasOwnProperty.call(NOTICES, searchParams.notice)
      ? NOTICES[searchParams.notice]
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">Courses</h1>
        <Link href="/admin/courses/new" className="btn-primary">
          <Plus size={18} aria-hidden="true" /> New course
        </Link>
      </div>

      <FormMessage success={notice} />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to get started."
          action={
            <Link href="/admin/courses/new" className="btn-primary">
              Create a course
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {courses.map((c) => (
            <li key={c.id} className="rounded-xl2 bg-white p-5 shadow-sm ring-1 ring-navy-100 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-navy-800 [overflow-wrap:anywhere]">{c.title}</h2>
                    <StatusBadge published={c.published} />
                  </div>
                  <p className="mt-1 text-sm text-navy-700/75 [overflow-wrap:anywhere]">
                    /{c.slug} · Updated {formatMemberSince(c.updated_at) ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <Link href={`/admin/courses/${c.id}`} className="btn-primary min-h-[44px] !px-4 !py-2.5 text-sm">
                    Manage
                  </Link>
                  <CoursePublishToggle courseId={c.id} published={c.published} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {truncated && <p className="text-sm text-navy-700/75">Showing the newest {COURSE_LIST_LIMIT} courses.</p>}
    </div>
  );
}
