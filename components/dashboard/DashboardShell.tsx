import { LogOut, LucideIcon } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/supabase/database.types";

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  tutor: "Tutor",
  admin: "Admin",
};

export interface DashboardSection {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function DashboardShell({
  role,
  displayName,
  email,
  sections,
}: {
  role: UserRole;
  displayName: string;
  email: string | null;
  sections: DashboardSection[];
}) {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh]">
      <div className="container-px mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl2 bg-navy-800 p-7 md:p-9 text-white shadow-premium">
          <div>
            <span className="eyebrow text-skyblue-300">{ROLE_LABEL[role]} Dashboard</span>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold">
              Welcome, {displayName}
            </h1>
            {email && <p className="mt-1 text-sm text-navy-100/75">{email}</p>}
          </div>

          <form action={logoutAction}>
            <button type="submit" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-navy-800 shrink-0">
              <LogOut size={16} /> Log Out
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-xl2 bg-white p-7 shadow-sm ring-1 ring-navy-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
                <s.icon size={22} />
              </div>
              <h2 className="mt-5 font-bold text-navy-800">{s.title}</h2>
              <p className="mt-2 text-sm text-navy-700/70 leading-relaxed">
                {s.description}
              </p>
              <span className="mt-4 inline-block rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700/70">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
