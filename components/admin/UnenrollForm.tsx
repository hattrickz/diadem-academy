"use client";

import { useFormState } from "react-dom";
import { UserMinus } from "lucide-react";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { unenrollStudentAction } from "@/lib/admin/enrollment-actions";
import type { ActionState } from "@/lib/admin/course-validation";

// Removal sits behind a native <details> disclosure (a deliberate second step
// that works without JavaScript). Only the enrollment id is posted; the server
// decides what that id refers to.
export default function UnenrollForm({
  enrollmentId,
  studentLabel,
  courseTitle,
}: {
  enrollmentId: string;
  studentLabel: string;
  courseTitle: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(unenrollStudentAction, {});

  return (
    <details className="w-full md:w-auto">
      <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-semibold text-diadem-red">
        <UserMinus size={16} aria-hidden="true" /> Remove…
      </summary>
      <form action={formAction} className="mt-2 space-y-3 rounded-xl border border-diadem-red/30 bg-white p-4">
        <p className="text-sm leading-relaxed text-navy-800">
          Remove <strong className="[overflow-wrap:anywhere]">{studentLabel}</strong> from{" "}
          <strong className="[overflow-wrap:anywhere]">{courseTitle}</strong>? They lose access to the course and its
          lessons immediately. You can enroll them again later.
        </p>
        <FormMessage error={state.error} />
        <input type="hidden" name="enrollmentId" value={enrollmentId} />
        <AdminSubmitButton variant="danger" compact pendingLabel="Removing…">
          Yes, remove enrollment
        </AdminSubmitButton>
      </form>
    </details>
  );
}
