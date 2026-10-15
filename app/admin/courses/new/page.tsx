import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import CourseForm from "@/components/admin/CourseForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Course",
  robots: { index: false, follow: false },
};

export default async function AdminNewCoursePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Courses
      </Link>
      <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">New course</h1>
      <section className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-8">
        <CourseForm mode="create" />
      </section>
    </div>
  );
}
