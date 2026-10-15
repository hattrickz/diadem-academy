import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, FilePen, ListChecks } from "lucide-react";
import { requireTutor } from "@/lib/tutor/guard";
import { getTutorDashboardStats } from "@/lib/tutor/data";
import { formatMemberSince, getFirstName } from "@/lib/profile-display";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";

// Depends on the signed-in tutor, so it must never be prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutor Dashboard",
  robots: { index: false, follow: false },
};

export default async function TutorDashboardPage() {
  // Server-side authorization first; every number below is a live database count.
  const { profile } = await requireTutor();
  const stats = await getTutorDashboardStats();
  const firstName = getFirstName(profile.full_name);

  return (
    <div className="space-y-8">
      <header className="rounded-xl2 bg-navy-800 p-7 text-white shadow-premium md:p-9">
        <span className="eyebrow text-skyblue-300">Tutor Dashboard</span>
        <h1 className="mt-2 break-words text-2xl font-extrabold md:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <div className="mt-5">
          <Link href="/tutor/courses" className="btn-primary">
            <BookOpen size={18} aria-hidden="true" /> Manage courses and lessons
          </Link>
        </div>
      </header>

      <section aria-label="Statistics" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={stats.courses.total}
          detail={`${stats.courses.published} published · ${stats.courses.drafts} draft`}
        />
        <StatCard icon={CheckCircle2} label="Published courses" value={stats.courses.published} />
        <StatCard icon={FilePen} label="Draft courses" value={stats.courses.drafts} />
        <StatCard
          icon={ListChecks}
          label="Lessons"
          value={stats.lessons.total}
          detail={`${stats.lessons.published} published · ${stats.lessons.drafts} draft`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-courses" className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100">
          <h2 id="recent-courses" className="font-bold text-navy-800">
            Recently updated courses
          </h2>
          {stats.recentCourses.length === 0 ? (
            <p className="mt-3 text-sm text-navy-700/75">No courses yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-100">
              {stats.recentCourses.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/tutor/courses/${c.id}`}
                      className="font-semibold text-navy-800 hover:text-skyblue-700 [overflow-wrap:anywhere]"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-navy-700/70">Updated {formatMemberSince(c.updated_at) ?? "—"}</p>
                  </div>
                  <StatusBadge published={c.published} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-lessons" className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100">
          <h2 id="recent-lessons" className="font-bold text-navy-800">
            Recently updated lessons
          </h2>
          {stats.recentLessons.length === 0 ? (
            <p className="mt-3 text-sm text-navy-700/75">No lessons yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-100">
              {stats.recentLessons.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/tutor/courses/${l.course_id}/lessons/${l.id}`}
                      className="font-semibold text-navy-800 hover:text-skyblue-700 [overflow-wrap:anywhere]"
                    >
                      {l.title}
                    </Link>
                    <p className="text-xs text-navy-700/70 [overflow-wrap:anywhere]">
                      {l.courseTitle ?? "Unknown course"} · Updated {formatMemberSince(l.updated_at) ?? "—"}
                    </p>
                  </div>
                  <StatusBadge published={l.published} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-sm text-navy-700/75">
        Creating or deleting courses and enrolling students are handled by administrators.
      </p>
    </div>
  );
}
