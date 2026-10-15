import type { LucideIcon } from "lucide-react";

// One real number from the database. `detail` is optional context (e.g.
// "3 published"). Never a placeholder value.
export default function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl2 bg-white p-6 shadow-sm ring-1 ring-navy-100">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
        <Icon size={20} aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-extrabold text-navy-800">{value.toLocaleString("en-GB")}</p>
      <p className="mt-1 text-sm font-semibold text-navy-800">{label}</p>
      {detail && <p className="mt-0.5 text-xs text-navy-700/70">{detail}</p>}
    </div>
  );
}
