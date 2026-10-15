import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CloudOff } from "lucide-react";
import { getPublishedCourses } from "@/lib/courses/public";
import EmptyState from "@/components/dashboard/student/EmptyState";
import CourseCard from "@/components/courses/CourseCard";

// Always rendered on request so newly published (or unpublished) courses show
// up immediately and the build never depends on the database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse the online courses available through Diadem Consult Academy, Fadeyi, Lagos.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh]">
      <div className="container-px mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="eyebrow">Online Courses</span>
          <h1 className="mt-3 text-3xl font-extrabold text-navy-800 md:text-4xl">
            Our Courses
          </h1>
          <p className="mt-4 leading-relaxed text-navy-700/80">
            Browse the courses currently offered through the academy. To enrol, get in
            touch and we&apos;ll set you up; once you&apos;re enrolled, log in to start learning.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="btn-primary">
              Enquire about enrolling
            </Link>
            <Link href="/login" className="btn-outline">
              Log in
            </Link>
          </div>
        </div>

        <div className="mt-12">
          {courses === null ? (
            <EmptyState
              icon={CloudOff}
              title="Courses are temporarily unavailable"
              description="We couldn't load the course list just now. Please try again in a moment."
            />
          ) : courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses are published yet"
              description="New courses will appear here as soon as they are available. In the meantime, see our in-person programs."
              action={
                <Link href="/programs" className="btn-primary">
                  Explore our programs
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.id}>
                  <CourseCard
                    title={course.title}
                    description={course.description}
                    thumbnailUrl={course.thumbnail_url}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}