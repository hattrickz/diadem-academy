import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ListChecks } from "lucide-react";
import { requireStudent } from "@/lib/supabase/require-student";
import { getPublishedLessons, requireEnrolledCourse } from "@/lib/courses/data";
import EmptyState from "@/components/dashboard/student/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course",
  robots: { index: false, follow: false },
};

export default async function StudentCoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  // 1) Authenticated student (server-side, role from the database).
  //    A static return path is used on purpose — URL params are not trusted.
  const { user } = await requireStudent("/student/courses");

  // 2) Enrolled + published, or notFound(). Same result whether the course
  //    doesn't exist or just isn't theirs.
  const course = await requireEnrolledCourse(params.courseId, user.id);

  // 3) Only published lessons, in display order.
  const lessons = await getPublishedLessons(course.id);

  return (
    <div className="space-y-8">
      <Link
        href="/student/courses"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500"
      >
        <ArrowLeft size={16} aria-hidden="true" /> My Courses
      </Link>

      <header className="rounded-xl2 bg-navy-800 p-7 text-white shadow-premium md:p-9">
        <span className="eyebrow text-skyblue-300">Course</span>
        <h1 className="mt-2 text-2xl font-extrabold [overflow-wrap:anywhere] md:text-3xl">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-navy-100/85 [overflow-wrap:anywhere] md:text-base">
            {course.description}
          </p>
        )}
      </header>

      <section aria-labelledby="lessons-heading" className="space-y-4">
        <h2 id="lessons-heading" className="text-xl font-bold text-navy-800">
          Lessons
          <span className="ml-2 text-sm font-medium text-navy-700/70">({lessons.length})</span>
        </h2>

        {lessons.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No lessons yet"
            description="Lessons for this course will appear here once they are published."
          />
        ) : (
          <ol className="space-y-3">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <Link
                  href={`/student/courses/${course.id}/lessons/${lesson.id}`}
                  className="flex min-h-[64px] items-center gap-4 rounded-xl2 bg-white p-4 shadow-sm ring-1 ring-navy-100 transition-colors hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500 md:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-skyblue-50 text-sm font-bold text-skyblue-700"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy-800 [overflow-wrap:anywhere]">
                      {lesson.title}
                    </span>
                    {lesson.description && (
                      <span className="mt-0.5 line-clamp-2 block text-sm text-navy-700/75 [overflow-wrap:anywhere]">
                        {lesson.description}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-navy-700/50" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
