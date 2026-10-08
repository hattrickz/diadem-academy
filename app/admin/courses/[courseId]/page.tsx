import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminCourse, getCourseDeletionImpact } from "@/lib/admin/course-data";
import StatusBadge from "@/components/admin/StatusBadge";
import CourseForm from "@/components/admin/CourseForm";
import CoursePublishToggle from "@/components/admin/CoursePublishToggle";
import DeleteCourseForm from "@/components/admin/DeleteCourseForm";
import FormMessage from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Course",
  robots: { index: false, follow: false },
};

// The ?notice= value is only ever used as a KEY into this fixed list.
const NOTICES: Record<string, string> = { created: "Course created." };

export default async function AdminCoursePage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { notice?: string | string[] };
}) {
  await requireAdmin();

  // A malformed or unknown id -> notFound() (validated as a uuid first).
  const course = await getAdminCourse(params.courseId);
  const impact = await getCourseDeletionImpact(course.id);
  const notice =
    typeof searchParams.notice === "string" && Object.prototype.hasOwnProperty.call(NOTICES, searchParams.notice)
      ? NOTICES[searchParams.notice]
      : null;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/courses"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Courses
      </Link>

      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-navy-800 [overflow-wrap:anywhere] md:text-3xl">
              {course.title}
            </h1>
            <StatusBadge published={course.published} />
          </div>
          <p className="mt-1 text-sm text-navy-700/75 [overflow-wrap:anywhere]">/{course.slug}</p>
        </div>
        <CoursePublishToggle courseId={course.id} published={course.published} />
      </header>

      <FormMessage success={notice} />

      <section aria-labelledby="details-heading" className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-8">
        <h2 id="details-heading" className="mb-5 text-lg font-bold text-navy-800">
          Course details
        </h2>
        <CourseForm mode="edit" course={course} />
      </section>

      <DeleteCourseForm
        courseId={course.id}
        title={course.title}
        lessons={impact.lessons}
        enrollments={impact.enrollments}
      />
    </div>
  );
}
