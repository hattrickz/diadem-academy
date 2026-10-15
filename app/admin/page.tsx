import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, FilePen, GraduationCap, Plus, Users, type LucideIcon } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { getDashboardStats } from "@/lib/admin/course-data";
import { formatMemberSince, getFirstName } from "@/lib/profile-display";
import StatusBadge from "@/components/admin/StatusBadge";

// Depends on the signed-in admin, so it must never be prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
        <Icon size={20} aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-extrabold text-navy-800">{value.toLocaleString("en-GB")}</p>
      <p className="mt-1 text-sm font-semibold text-navy-800">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  // Server-side authorization first; every number below is a live database count.
  const { profile } = await requireAdmin();
  const stats = await getDashboardStats();
  const firstName = getFirstName(profile.full_name);

  return (
    <div className="space-y-8">
      <header className="rounded-xl2 bg-navy-800 p-7 text-white shadow-premium md:p-9">
        <span className="eyebrow text-skyblue-300">Admin Dashboard</span>
        <h1 className="mt-2 break-words text-2xl font-extrabold md:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/admin/courses/new" className="btn-primary">
            <Plus size={18} aria-hidden="true" /> New course
          </Link>
          <Link
            href="/admin/courses"
            className="btn-outline !border-white !text-white hover:!bg-white hover:!text-navy-800"
          >
            Manage courses
          </Link>
          <Link
            href="/admin/enrollments"
            className="btn-outline !border-white !text-white hover:!bg-white hover:!text-navy-800"
          >
            Manage enrollments
          </Link>
        </div>
      </header>

      <section aria-label="Statistics" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={BookOpen} label="Courses" value={stats.courses} />
        <StatCard icon={CheckCircle2} label="Published" value={stats.published} />
        <StatCard icon={FilePen} label="Drafts" value={stats.drafts} />
        <StatCard icon={GraduationCap} label="Students" value={stats.students} />
        <StatCard icon={Users} label="Enrollments" value={stats.enrollments} />
      </section>

      <section aria-labelledby="recent-heading" className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100">
        <h2 id="recent-heading" className="font-bold text-navy-800">
          Recently updated courses
        </h2>
        {stats.recentCourses.length === 0 ? (
          <p className="mt-3 text-sm text-navy-700/75">No courses yet. Create the first one to get started.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-100">
            {stats.recentCourses.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/courses/${c.id}`}
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
    </div>
  );
}
