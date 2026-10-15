import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTutor } from "@/lib/tutor/guard";
import { getAdminCourse } from "@/lib/admin/course-data";
import { getCourseLesson, listCourseLessons } from "@/lib/tutor/data";
import StatusBadge from "@/components/admin/StatusBadge";
import LessonForm from "@/components/tutor/LessonForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Lesson",
  robots: { index: false, follow: false },
};

export default async function TutorEditLessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  await requireTutor();

  const course = await getAdminCourse(params.courseId);
  // Matched on BOTH ids: a lesson id from another course is "not found" here.
  const lesson = await getCourseLesson(course.id, params.lessonId);

  // Show the lesson's CURRENT place (1 = first), so saving without touching the
  // field never moves it, even if stored positions have gaps or duplicates.
  const ordered = await listCourseLessons(course.id);
  const rank = ordered.findIndex((l) => l.id === lesson.id) + 1;
  const backHref = `/tutor/courses/${course.id}`;

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex min-h-[44px] max-w-full items-center gap-1.5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800"
      >
        <ArrowLeft size={16} aria-hidden="true" className="shrink-0" />
        <span className="[overflow-wrap:anywhere]">{course.title}</span>
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">Edit lesson</h1>
        <StatusBadge published={lesson.published} />
      </div>

      <section className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-8">
        <LessonForm mode="edit" courseId={course.id} lesson={lesson} rank={rank > 0 ? rank : undefined} backHref={backHref} />
      </section>
    </div>
  );
}
