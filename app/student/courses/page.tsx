import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireStudent } from "@/lib/supabase/require-student";
import { getEnrolledCourses } from "@/lib/courses/data";
import EmptyState from "@/components/dashboard/student/EmptyState";
import CourseCard from "@/components/courses/CourseCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "My Courses",
    robots: { index: false, follow: false },
};

export default async function StudentCoursesPage() {
    // Layouts aren't re-run on client-side navigation, so this page enforces
    // access itself. The user id comes from Supabase Auth, never from the URL.
    const { user } = await requireStudent("/student/courses");
    const courses = await getEnrolledCourses(user.id);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">My Courses</h1>

            {courses.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No courses yet"
                    description="Your enrolled courses will appear here."
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
                                href={`/student/courses/${course.id}`}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}