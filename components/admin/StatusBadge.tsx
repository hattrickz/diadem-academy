import { CheckCircle2, CircleDashed } from "lucide-react";

// Status is shown with an icon AND text, never colour alone.
export default function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 size={13} aria-hidden="true" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700 ring-1 ring-navy-100">
      <CircleDashed size={13} aria-hidden="true" /> Draft
    </span>
  );
}
