import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;

  const isError = Boolean(error);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-diadem-red/30 bg-diadem-red/5 text-diadem-red"
          : "border-emerald-300 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}
      <span>{error ?? success}</span>
    </div>
  );
}
