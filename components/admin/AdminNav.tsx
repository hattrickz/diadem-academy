"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

// Client component only to mark the active link. It carries no data and makes
// no access decision: middleware.ts, every page (requireAdmin) and every server
// action (authorizeAdminAction) enforce access on the server.
const ITEMS: Record<"admin" | "tutor", { href: string; label: string; icon: LucideIcon }[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/courses", label: "Courses", icon: BookOpen },
    { href: "/admin/enrollments", label: "Enrollments", icon: Users },
  ],
  tutor: [
    { href: "/tutor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tutor/courses", label: "Courses", icon: BookOpen },
  ],
};

export default function AdminNav({ area = "admin" }: { area?: "admin" | "tutor" }) {
  const pathname = usePathname();

  return (
    <nav aria-label={area === "admin" ? "Admin" : "Tutor"}>
      <ul className="flex flex-wrap gap-2">
        {ITEMS[area].map(({ href, label, icon: Icon }) => {
          const active = href === `/${area}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500 ${
                  active
                    ? "bg-navy-800 text-white shadow-sm"
                    : "bg-white text-navy-800 ring-1 ring-navy-100 hover:bg-navy-50"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
