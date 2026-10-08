"use client";

import Link from "next/link";
import { useId } from "react";
import { useFormState } from "react-dom";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { createCourseAction, updateCourseAction } from "@/lib/admin/course-actions";
import type { ActionState } from "@/lib/admin/course-validation";
import type { Course } from "@/lib/supabase/database.types";

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-navy-700/40 focus:outline-none focus:ring-2";
const okBorder = "border-navy-100 focus:border-skyblue-500 focus:ring-skyblue-200";
const badBorder = "border-diadem-red focus:border-diadem-red focus:ring-diadem-red/20";

function Field({
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

// Create / edit form. All validation happens on the server
// (lib/admin/course-validation.ts); the inputs carry no client-side rules that
// could be mistaken for security.
export default function CourseForm({ mode, course }: { mode: "create" | "edit"; course?: Course }) {
  const editing = mode === "edit" && course;
  const [state, formAction] = useFormState<ActionState, FormData>(
    editing ? updateCourseAction : createCourseAction,
    {}
  );
  // After a rejected submit the server echoes what was typed, so nothing is lost.
  const value = (name: string, fallback: string) => state.values?.[name] ?? fallback;
  const published = state.values ? state.values.published === "on" : (course?.published ?? false);
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage error={state.error} success={state.success} />
      {editing && <input type="hidden" name="courseId" value={course.id} />}

      <Field name="title" label="Title" required error={err.title}>
        {({ id, className, describedBy }) => (
          <input
            id={id}
            name="title"
            type="text"
            defaultValue={value("title", course?.title ?? "")}
            maxLength={200}
            autoComplete="off"
            aria-invalid={err.title ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <Field
        name="slug"
        label="URL slug"
        error={err.slug}
        hint="Lowercase letters, numbers and hyphens. Leave blank to create it from the title. Links to the course use its ID, so changing the slug never breaks them."
      >
        {({ id, className, describedBy }) => (
          <input
            id={id}
            name="slug"
            type="text"
            defaultValue={value("slug", course?.slug ?? "")}
            maxLength={100}
            autoComplete="off"
            aria-invalid={err.slug ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <Field
        name="description"
        label="Description"
        error={err.description}
        hint="Shown on the course card and at the top of the course page. Plain text."
      >
        {({ id, className, describedBy }) => (
          <textarea
            id={id}
            name="description"
            rows={5}
            defaultValue={value("description", course?.description ?? "")}
            aria-invalid={err.description ? true : undefined}
            aria-describedby={describedBy}
            className={`${className} resize-y`}
          />
        )}
      </Field>

      <Field
        name="thumbnail_url"
        label="Thumbnail image link"
        error={err.thumbnail_url}
        hint="Optional. Must be an https:// link to an image. Uploading images isn't available yet."
      >
        {({ id, className, describedBy }) => (
          <input
            id={id}
            name="thumbnail_url"
            type="text"
            inputMode="url"
            placeholder="https://…"
            defaultValue={value("thumbnail_url", course?.thumbnail_url ?? "")}
            autoComplete="off"
            aria-invalid={err.thumbnail_url ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <div className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-4">
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={published}
          aria-describedby="published-desc"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-navy-200 text-skyblue-600 focus:ring-2 focus:ring-skyblue-200"
        />
        <div className="min-w-0">
          <label htmlFor="published" className="block text-sm font-semibold text-navy-800">
            {editing ? "Published" : "Publish immediately"}
          </label>
          <p id="published-desc" className="mt-0.5 text-xs text-navy-700/70">
            Published courses appear in the public catalog and to enrolled students. Leave unticked to keep it as a draft.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminSubmitButton>{editing ? "Save changes" : "Create course"}</AdminSubmitButton>
        <Link href="/admin/courses" className="btn-outline">
          {editing ? "Back to courses" : "Cancel"}
        </Link>
      </div>
    </form>
  );
}
