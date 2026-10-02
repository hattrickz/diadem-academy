"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, UserCircle, type LucideIcon } from "lucide-react";

// Client component only because it needs the current path to mark the
// active link. It carries no data and makes no authorization decisions —
// every /student page and middleware.ts enforce access on the server.
const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/courses", label: "My Courses", icon: BookOpen },
    { href: "/student/profile", label: "Profile", icon: UserCircle },
];

export default function StudentNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Student dashboard">
            <ul className="flex flex-wrap gap-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active =
                        href === "/student" ? pathname === href : pathname.startsWith(href);

                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500 ${active
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