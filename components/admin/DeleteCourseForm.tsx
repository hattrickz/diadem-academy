"use client";

import { useFormState } from "react-dom";
import { Trash2 } from "lucide-react";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { deleteCourseAction } from "@/lib/admin/course-actions";
import type { ActionState } from "@/lib/admin/course-validation";

// Destructive action behind a native <details> disclosure (a deliberate second
// step that works without JavaScript). The lesson and enrollment counts are the
// REAL numbers from the database; the cascade is stated plainly, not hidden.
export default function DeleteCourseForm({
  courseId,
  title,
  lessons,
  enrollments,
}: {
  courseId: string;
  title: string;
  lessons: number;
  enrollments: number;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(deleteCourseAction, {});
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <details className="rounded-xl2 border border-diadem-red/30 bg-white p-5 md:p-6">
      <summary className="cursor-pointer text-sm font-semibold text-diadem-red">Delete this course…</summary>

      <form action={formAction} className="mt-4 space-y-4">
        <div className="rounded-xl border border-diadem-red/30 bg-diadem-red/5 p-4 text-sm leading-relaxed text-navy-800">
          <p className="font-semibold">Deleting this course is permanent and also deletes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>{plural(lessons, "lesson")}</strong>
            </li>
            <li>
              <strong>{plural(enrollments, "student enrollment")}</strong>
              {enrollments > 0 && " — those students lose access immediately"}
            </li>
          </ul>
          <p className="mt-2">It can&apos;t be undone. To hide the course instead, unpublish it.</p>
        </div>

        <FormMessage error={state.error} />
        <input type="hidden" name="courseId" value={courseId} />

        <div>
          <label htmlFor="confirmTitle" className="mb-1.5 block text-sm font-semibold text-navy-800">
            Type the course title to confirm
          </label>
          <input
            id="confirmTitle"
            name="confirmTitle"
            type="text"
            autoComplete="off"
            placeholder={title}
            aria-invalid={state.fieldErrors?.confirmTitle ? true : undefined}
            aria-describedby="confirmTitle-hint"
            className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-diadem-red focus:outline-none focus:ring-2 focus:ring-diadem-red/20"
          />
          <p
            id="confirmTitle-hint"
            className={`mt-1.5 text-xs [overflow-wrap:anywhere] ${
              state.fieldErrors?.confirmTitle ? "font-semibold text-diadem-red" : "text-navy-700/70"
            }`}
          >
            {state.fieldErrors?.confirmTitle ?? `Type exactly: ${title}`}
          </p>
        </div>

        <AdminSubmitButton variant="danger" pendingLabel="Deleting…">
          <Trash2 size={16} aria-hidden="true" /> Delete course permanently
        </AdminSubmitButton>
      </form>
    </details>
  );
}
