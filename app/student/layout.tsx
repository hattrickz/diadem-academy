import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import StudentNav from "@/components/dashboard/student/StudentNav";

// Structure only: navigation + log out. This layout deliberately does NOT
// fetch the user or decide access — layouts aren't re-run on client-side
// navigation, so each page calls requireStudent() itself, and middleware.ts
// gates everything under /student as well.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="section-y bg-navy-50/60 min-h-[70vh]">
            <div className="container-px mx-auto max-w-6xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <StudentNav />

                    <form action={logoutAction}>
                        <button
                            type="submit"
                            className="btn-outline min-h-[44px] !px-4 !py-2.5 text-sm"
                        >
                            <LogOut size={16} aria-hidden="true" /> Log Out
                        </button>
                    </form>
                </div>

                <div className="mt-6 md:mt-8">{children}</div>
            </div>
        </section>
    );
}