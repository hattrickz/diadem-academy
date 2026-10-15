"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { Field } from "@/components/admin/FormField";
import { enrollStudentAction } from "@/lib/admin/enrollment-actions";
import type { ActionState } from "@/lib/admin/course-validation";

export interface Option {
  value: string;
  label: string;
}

// The two lists come from the server (real students and real courses). The ids
// that are posted are validated again on the server, so editing the HTML here
// gains nothing.
export default function EnrollStudentForm({
  students,
  courses,
  defaultCourseId = "",
}: {
  students: Option[];
  courses: Option[];
  defaultCourseId?: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(enrollStudentAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const err = state.fieldErrors ?? {};

  // Clear the selection after a successful enrollment.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-5">
      <FormMessage error={state.error} success={state.success} />

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          name="studentId"
          label="Student"
          required
          error={err.studentId}
          hint="Shown as name, email and the last 4 characters of the account ID, so look-alike accounts can be told apart."
        >
          {({ id, className, describedBy }) => (
            <select
              id={id}
              name="studentId"
              defaultValue={state.values?.studentId ?? ""}
              aria-invalid={err.studentId ? true : undefined}
              aria-describedby={describedBy}
              className={className}
            >
              <option value="">Choose a student…</option>
              {students.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field name="courseId" label="Course" required error={err.courseId}>
          {({ id, className, describedBy }) => (
            <select
              id={id}
              name="courseId"
              defaultValue={state.values?.courseId ?? defaultCourseId}
              aria-invalid={err.courseId ? true : undefined}
              aria-describedby={describedBy}
              className={className}
            >
              <option value="">Choose a course…</option>
              {courses.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <AdminSubmitButton pendingLabel="Enrolling…">Enroll student</AdminSubmitButton>
    </form>
  );
}
