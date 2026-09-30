import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, LineChart, Award, ClipboardList, UserCircle } from "lucide-react";
import { getUserWithProfile } from "@/lib/supabase/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

// This page depends on the authenticated user's session/cookies and must
// never be statically prerendered at build time — each request needs a
// fresh, real check against Supabase Auth.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Dashboard",
  robots: { index: false, follow: false },
};

const sections = [
  { icon: BookOpen, title: "My Courses", description: "Courses you're enrolled in will appear here once course enrollment launches." },
  { icon: LineChart, title: "Learning Progress", description: "Track your progress through lessons and modules as they become available." },
  { icon: ClipboardList, title: "Assignments", description: "Assignments and their status will be listed here in a future update." },
  { icon: Award, title: "Certificates", description: "Certificates you've earned will be shown here once available." },
  { icon: UserCircle, title: "Profile", description: "Manage your name, phone number and photo here in a future update." },
];

export default async function StudentDashboardPage() {
  // Server-side authorization — never trust a role from the browser.
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/student");
  }

  // Explicit, loop-safe authorization: only a confirmed 'student' role
  // renders this page. Known other roles go to their own dashboard;
  // anything unexpected (e.g. a missing profile row) goes to a neutral
  // page rather than bouncing between dashboards.
  if (profile?.role === "tutor") {
    redirect("/tutor");
  }
  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role !== "student") {
    redirect("/");
  }

  const displayName = profile?.full_name || user.email || "Student";

  return (
    <DashboardShell
      role="student"
      displayName={displayName}
      email={user.email ?? null}
      sections={sections}
    />
  );
}
