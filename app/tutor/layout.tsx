import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import AdminNav from "@/components/admin/AdminNav";

// Structure only: navigation + log out. Like the student and admin layouts, this
// does NOT fetch the user or decide access (layouts aren't re-run on client-side
// navigation). Every page calls requireTutor() itself, every server action
// re-checks the role, and middleware.ts gates everything under /tutor.
export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh]">
      <div className="container-px mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminNav area="tutor" />

          <form action={logoutAction}>
            <button type="submit" className="btn-outline min-h-[44px] !px-4 !py-2.5 text-sm">
              <LogOut size={16} aria-hidden="true" /> Log Out
            </button>
          </form>
        </div>

        <div className="mt-6 md:mt-8">{children}</div>
      </div>
    </section>
  );
}
