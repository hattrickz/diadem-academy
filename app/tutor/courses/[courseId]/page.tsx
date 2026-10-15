import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, ListChecks, Pencil, Plus, Video } from "lucide-react";
import { requireTutor } from "@/lib/tutor/guard";
import { getAdminCourse } from "@/lib/admin/course-data";
import { listCourseLessons } from "@/lib/tutor/data";
import StatusBadge from "@/components/admin/StatusBadge";
import CourseForm from "@/components/admin/CourseForm";
import CoursePublishToggle from "@/components/admin/CoursePublishToggle";
import { LessonMoveButton, LessonPublishToggle } from "@/components/tutor/LessonActions";
import EmptyState from "@/components/dashboard/student/EmptyState";
import FormMessage from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Course",
  robots: { index: false, follow: false },
};

// The ?notice= value is only ever used as a KEY into this fixed list.
const NOTICES: Record<string, string> = {
  "lesson-created": "Lesson created.",
  "lesson-created-reorder-failed": "Lesson created, but its position couldn't be set. Use the arrows to move it.",
};

export default async function TutorCoursePage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { notice?: string | string[] };
}) {
  await requireTutor();

  // A malformed or unknown id -> notFound() (validated as a uuid first).
  const course = await getAdminCourse(params.courseId);
  const lessons = await listCourseLessons(course.id);
  const notice =
    typeof searchParams.notice === "string" && Object.prototype.hasOwnProperty.call(NOTICES, searchParams.notice)
      ? NOTICES[searchParams.notice]
      : null;

  return (
    <div className="space-y-8">
      <Link
        href="/tutor/courses"
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
        <CoursePublishToggle courseId={course.id} published={course.published} area="tutor" />
      </header>

      <FormMessage success={notice} />

      <section aria-labelledby="details-heading" className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-8">
        <h2 id="details-heading" className="mb-5 text-lg font-bold text-navy-800">
          Course details
        </h2>
        <CourseForm mode="edit" course={course} area="tutor" />
      </section>

      <section aria-labelledby="lessons-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lessons-heading" className="text-lg font-bold text-navy-800">
            Lessons <span className="text-sm font-medium text-navy-700/70">({lessons.length})</span>
          </h2>
          <Link
            href={`/tutor/courses/${course.id}/lessons/new`}
            className="btn-primary min-h-[44px] !px-4 !py-2.5 text-sm"
          >
            <Plus size={16} aria-hidden="true" /> Add lesson
          </Link>
        </div>

        {lessons.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No lessons yet"
            description="Add the first lesson to this course."
            action={
              <Link href={`/tutor/courses/${course.id}/lessons/new`} className="btn-primary">
                Add a lesson
              </Link>
            }
          />
        ) : (
          <ol className="space-y-3">
            {lessons.map((lesson, index) => (
              <li key={lesson.id} className="rounded-xl2 bg-white p-4 shadow-sm ring-1 ring-navy-100 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-skyblue-50 text-sm font-bold text-skyblue-700"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-navy-800 [overflow-wrap:anywhere]">{lesson.title}</h3>
                        <StatusBadge published={lesson.published} />
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-700/75">
                        <span>Lesson {index + 1}</span>
                        {lesson.video_url && (
                          <span className="inline-flex items-center gap-1">
                            <Video size={13} aria-hidden="true" /> Video
                          </span>
                        )}
                        {lesson.pdf_url && (
                          <span className="inline-flex items-center gap-1">
                            <FileText size={13} aria-hidden="true" /> PDF
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2">
                    <Link
                      href={`/tutor/courses/${course.id}/lessons/${lesson.id}`}
                      className="btn-outline min-h-[44px] !px-4 !py-2.5 text-sm"
                    >
                      <Pencil size={16} aria-hidden="true" /> Edit
                    </Link>
                    <LessonMoveButton
                      courseId={course.id}
                      lessonId={lesson.id}
                      direction="up"
                      disabled={index === 0}
                      lessonTitle={lesson.title}
                    />
                    <LessonMoveButton
                      courseId={course.id}
                      lessonId={lesson.id}
                      direction="down"
                      disabled={index === lessons.length - 1}
                      lessonTitle={lesson.title}
                    />
                    <LessonPublishToggle courseId={course.id} lessonId={lesson.id} published={lesson.published} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="rounded-xl2 border border-navy-100 bg-white p-5 text-sm text-navy-700/80">
        Deleting a course and enrolling students are handled by administrators.
      </p>
    </div>
  );
}
