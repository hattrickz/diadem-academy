import { useId } from "react";

// Shared labelled-field wrapper for the admin / tutor forms (used by CourseForm
// and LessonForm). Shows the hint, or the field error with role="alert".
export const inputClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:outline-none focus:ring-2";
const okBorder = "border-navy-100 focus:border-skyblue-500 focus:ring-skyblue-200";
const badBorder = "border-diadem-red focus:border-diadem-red focus:ring-diadem-red/20";

export function Field({
  name,
  label,
  error,
  hint,
  required,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; className: string; describedBy?: string }) => React.ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-800">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-diadem-red"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children({ id, className: `${inputClass} ${error ? badBorder : okBorder}`, describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-navy-700/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-diadem-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-4">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={`${id}-desc`}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-navy-200 text-skyblue-600 focus:ring-2 focus:ring-skyblue-200"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-navy-800">
          {label}
        </label>
        <p id={`${id}-desc`} className="mt-0.5 text-xs text-navy-700/70">
          {description}
        </p>
      </div>
    </div>
  );
}
