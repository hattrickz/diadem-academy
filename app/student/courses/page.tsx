import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireStudent } from "@/lib/supabase/require-student";
import EmptyState from "@/components/dashboard/student/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "My Courses",
    robots: { index: false, follow: false },
};

export default async function StudentCoursesPage() {
    // Layouts aren't re-run on client-side navigation, so this page enforces
    // access itself.
    await requireStudent("/student/courses");

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">My Courses</h1>

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
        </div>
    );
}