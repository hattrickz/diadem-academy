import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { requireStudent } from "@/lib/supabase/require-student";
import {
  getPublishedLessons,
  requireEnrolledCourse,
  requirePublishedLesson,
} from "@/lib/courses/data";
import LessonMedia from "@/components/courses/LessonMedia";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lesson",
  robots: { index: false, follow: false },
};

export default async function StudentLessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  // 1) Authenticated student (server-side, role from the database).
  const { user } = await requireStudent("/student/courses");

  // 2) Enrolled in THIS course (and it is published), or notFound().
  const course = await requireEnrolledCourse(params.courseId, user.id);

  // 3) The lesson must be published AND belong to that same course. The
  //    verified course.id is used — not the raw URL value — so a lesson id
  //    from another course can't be paired with this one.
  const lesson = await requirePublishedLesson(course.id, params.lessonId);

  const lessons = await getPublishedLessons(course.id);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const lessonHref = (id: string) => `/student/courses/${course.id}/lessons/${id}`;

  return (
    <div className="space-y-6">
      <Link
        href={`/student/courses/${course.id}`}
        className="inline-flex min-h-[44px] max-w-full items-center gap-1.5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500"
      >
        <ArrowLeft size={16} aria-hidden="true" className="shrink-0" />
        <span className="[overflow-wrap:anywhere]">{course.title}</span>
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0 space-y-6">
          <header>
            {index >= 0 && (
              <p className="text-sm font-semibold text-navy-700/70">
                Lesson {index + 1} of {lessons.length}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-extrabold text-navy-800 [overflow-wrap:anywhere] md:text-3xl">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-700/85 [overflow-wrap:anywhere] md:text-base">
                {lesson.description}
              </p>
            )}
          </header>

          <LessonMedia title={lesson.title} videoUrl={lesson.video_url} pdfUrl={lesson.pdf_url} />

          <nav aria-label="Lesson navigation" className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {previous ? (
              <Link href={lessonHref(previous.id)} className="btn-outline justify-start">
                <ChevronLeft size={18} aria-hidden="true" className="shrink-0" />
                <span className="text-left [overflow-wrap:anywhere]">
                  <span className="block text-xs font-medium opacity-80">Previous</span>
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={lessonHref(next.id)} className="btn-primary justify-end">
                <span className="text-right [overflow-wrap:anywhere]">
                  <span className="block text-xs font-medium opacity-80">Next</span>
                  {next.title}
                </span>
                <ChevronRight size={18} aria-hidden="true" className="shrink-0" />
              </Link>
            )}
          </nav>
        </article>

        <aside aria-labelledby="course-lessons-heading" className="min-w-0">
          <div className="rounded-xl2 bg-white p-5 shadow-sm ring-1 ring-navy-100">
            <h2 id="course-lessons-heading" className="font-bold text-navy-800">
              Lessons in this course
            </h2>
            <ol className="mt-3 space-y-1">
              {lessons.map((item, i) => {
                const current = item.id === lesson.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={lessonHref(item.id)}
                      aria-current={current ? "page" : undefined}
                      className={`flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500 ${
                        current
                          ? "bg-navy-800 font-semibold text-white"
                          : "text-navy-800 hover:bg-navy-50"
                      }`}
                    >
                      <span aria-hidden="true" className="w-5 shrink-0 font-bold">
                        {i + 1}
                      </span>
                      <span className="min-w-0 [overflow-wrap:anywhere]">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
