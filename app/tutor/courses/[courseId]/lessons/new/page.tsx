import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTutor } from "@/lib/tutor/guard";
import { getAdminCourse } from "@/lib/admin/course-data";
import LessonForm from "@/components/tutor/LessonForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add Lesson",
  robots: { index: false, follow: false },
};

export default async function TutorNewLessonPage({ params }: { params: { courseId: string } }) {
  await requireTutor();
  const course = await getAdminCourse(params.courseId); // bad / unknown id -> notFound()
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
      <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">Add a lesson</h1>
      <section className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-8">
        <LessonForm mode="create" courseId={course.id} backHref={backHref} />
      </section>
    </div>
  );
}
