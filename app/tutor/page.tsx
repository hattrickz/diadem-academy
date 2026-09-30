import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, Users, ClipboardList, FileText } from "lucide-react";
import { getUserWithProfile } from "@/lib/supabase/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

// This page depends on the authenticated user's session/cookies and must
// never be statically prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutor Dashboard",
  robots: { index: false, follow: false },
};

const sections = [
  { icon: BookOpen, title: "My Courses", description: "Courses you teach will be managed here once course tools are built." },
  { icon: Users, title: "Students", description: "A list of your enrolled students will appear here in a future update." },
  { icon: ClipboardList, title: "Assignments", description: "Create and review assignments here once available." },
  { icon: FileText, title: "Content", description: "Upload lessons, videos and PDF materials here in a future update." },
];

export default async function TutorDashboardPage() {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login?redirect=/tutor");
  }

  // Explicit, loop-safe authorization: only a confirmed 'tutor' role
  // renders this page. Known other roles go to their own dashboard;
  // anything unexpected goes to a neutral page rather than bouncing
  // between dashboards.
  if (profile?.role === "student") {
    redirect("/student");
  }
  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role !== "tutor") {
    redirect("/");
  }

  const displayName = profile?.full_name || user.email || "Tutor";

  return (
    <DashboardShell
      role="tutor"
      displayName={displayName}
      email={user.email ?? null}
      sections={sections}
    />
  );
}
