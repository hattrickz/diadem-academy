import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, GraduationCap, BookOpen, CreditCard, Newspaper, BarChart3, Settings } from "lucide-react";
import { getUserWithProfile } from "@/lib/supabase/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

// This page depends on the authenticated user's session/cookies and must
// never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

const sections = [
  { icon: Users, title: "Students", description: "Manage student accounts here once the admin CMS is built." },
  { icon: GraduationCap, title: "Tutors", description: "Manage tutor accounts and permissions here in a future update." },
  { icon: BookOpen, title: "Courses & Lessons", description: "Create and manage courses and lessons here once available." },
  { icon: CreditCard, title: "Payments", description: "Review payments and enrollments here in a future update." },
  { icon: Newspaper, title: "Blog", description: "Manage blog posts and categories here once the CMS is built." },
  { icon: BarChart3, title: "Reports", description: "Platform analytics and reports will appear here." },
  { icon: Settings, title: "Settings", description: "Platform-wide settings will be managed here." },
];

export default async function AdminDashboardPage() {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Explicit, loop-safe authorization: only a confirmed 'admin' role
  // renders this page.
  if (profile?.role === "student") {
    redirect("/student");
  }
  if (profile?.role === "tutor") {
    redirect("/tutor");
  }
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const displayName = profile?.full_name || user.email || "Admin";

  return (
    <DashboardShell
      role="admin"
      displayName={displayName}
      email={user.email ?? null}
      sections={sections}
    />
  );
}
