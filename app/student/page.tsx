import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, LineChart, UserCircle } from "lucide-react";
import { requireStudent } from "@/lib/supabase/require-student";
import { getFirstName } from "@/lib/profile-display";
import ProfileFields from "@/components/dashboard/student/ProfileFields";

// Depends on the authenticated user's session/cookies, so it must never be
// statically prerendered — every request does a fresh check against Supabase.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Dashboard",
  robots: { index: false, follow: false },
};

const cardClass = "rounded-xl2 bg-white p-7 shadow-sm ring-1 ring-navy-100";
const iconBoxClass =
  "flex h-12 w-12 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600";
const linkClass =
  "mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500";

export default async function StudentDashboardPage() {
  // Server-side authorization. Name and role come from Supabase, never from
  // the URL or browser.
  const { user, profile } = await requireStudent("/student");

  const firstName = getFirstName(profile.full_name);
  const email = user.email ?? profile.email;

  return (
    <div className="space-y-8">
      <header className="rounded-xl2 bg-navy-800 p-7 text-white shadow-premium md:p-9">
        <span className="eyebrow text-skyblue-300">Student Dashboard</span>
        <h1 className="mt-2 break-words text-2xl font-extrabold md:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        {email && <p className="mt-1 break-all text-sm text-navy-100/75">{email}</p>}
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <section aria-labelledby="courses-heading" className={cardClass}>
          <div className={iconBoxClass}>
            <BookOpen size={22} aria-hidden="true" />
          </div>
          <h2 id="courses-heading" className="mt-5 font-bold text-navy-800">
            My Courses
          </h2>
          <p className="mt-2 text-sm font-semibold text-navy-800">No courses yet</p>
          <p className="mt-1 text-sm leading-relaxed text-navy-700/75">
            Your enrolled courses will appear here.
          </p>
          <Link href="/student/courses" className={linkClass}>
            View My Courses <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section aria-labelledby="progress-heading" className={cardClass}>
          <div className={iconBoxClass}>
            <LineChart size={22} aria-hidden="true" />
          </div>
          <h2 id="progress-heading" className="mt-5 font-bold text-navy-800">
            Learning Progress
          </h2>
          <p className="mt-2 text-sm font-semibold text-navy-800">Nothing to track yet</p>
          <p className="mt-1 text-sm leading-relaxed text-navy-700/75">
            Your progress will appear here once you are enrolled in a course.
          </p>
        </section>

        <section
          aria-labelledby="profile-heading"
          className={`${cardClass} md:col-span-2 lg:col-span-1`}
        >
          <div className={iconBoxClass}>
            <UserCircle size={22} aria-hidden="true" />
          </div>
          <h2 id="profile-heading" className="mt-5 font-bold text-navy-800">
            Profile
          </h2>
          <div className="mt-4">
            <ProfileFields
              items={[
                { label: "Name", value: profile.full_name },
                { label: "Email", value: email },
                { label: "Phone", value: profile.phone },
                { label: "Account type", value: "Student" },
              ]}
            />
          </div>
          <Link href="/student/profile" className={linkClass}>
            View profile <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}