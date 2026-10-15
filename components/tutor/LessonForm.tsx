"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { CheckboxField, Field } from "@/components/admin/FormField";
import { createLessonAction, updateLessonAction } from "@/lib/tutor/lesson-actions";
import type { ActionState } from "@/lib/admin/course-validation";
import { getVideoSource, safeHttpsUrl } from "@/lib/media";
import type { Lesson } from "@/lib/supabase/database.types";

// What students will actually get for the SAVED video link.
function videoStatus(url: string | null): string {
  const video = getVideoSource(url);
  if (!video) return "No video is set.";
  return video.kind === "embed"
    ? `Saved: students will see an embedded ${video.provider} player.`
    : "Saved: students will see a “Watch video” link that opens in a new tab (only YouTube and Vimeo links are embedded).";
}

// Create / edit a lesson. All validation happens on the server
// (lib/tutor/lesson-validation.ts); the inputs carry no client-side rules that
// could be mistaken for security.
export default function LessonForm({
  mode,
  courseId,
  lesson,
  rank,
  backHref,
}: {
  mode: "create" | "edit";
  courseId: string;
  lesson?: Lesson;
  /** The lesson's CURRENT place in the course (1 = first), not its raw stored value. */
  rank?: number;
  backHref: string;
}) {
  const editing = mode === "edit" && lesson;
  const [state, formAction] = useFormState<ActionState, FormData>(
    editing ? updateLessonAction : createLessonAction,
    {}
  );
  const value = (name: string, fallback: string) => state.values?.[name] ?? fallback;
  const published = state.values ? state.values.published === "on" : (lesson?.published ?? false);
  const err = state.fieldErrors ?? {};

  const inputBase = { autoComplete: "off" } as const;

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage error={state.error} success={state.success} />
      <input type="hidden" name="courseId" value={courseId} />
      {editing && <input type="hidden" name="lessonId" value={lesson.id} />}

      <Field name="title" label="Title" required error={err.title}>
        {({ id, className, describedBy }) => (
          <input
            {...inputBase}
            id={id}
            name="title"
            type="text"
            defaultValue={value("title", lesson?.title ?? "")}
            maxLength={200}
            aria-invalid={err.title ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <Field name="description" label="Description" error={err.description} hint="Plain text shown above the video.">
        {({ id, className, describedBy }) => (
          <textarea
            id={id}
            name="description"
            rows={5}
            defaultValue={value("description", lesson?.description ?? "")}
            aria-invalid={err.description ? true : undefined}
            aria-describedby={describedBy}
            className={`${className} resize-y`}
          />
        )}
      </Field>

      <Field
        name="video_url"
        label="Video link (YouTube or Vimeo)"
        error={err.video_url}
        hint={
          editing
            ? videoStatus(lesson.video_url)
            : "Optional. Must be an https:// link. YouTube and Vimeo links are embedded; any other https link opens as an external link."
        }
      >
        {({ id, className, describedBy }) => (
          <input
            {...inputBase}
            id={id}
            name="video_url"
            type="text"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            defaultValue={value("video_url", lesson?.video_url ?? "")}
            aria-invalid={err.video_url ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <Field
        name="pdf_url"
        label="PDF link"
        error={err.pdf_url}
        hint={
          editing && safeHttpsUrl(lesson.pdf_url)
            ? "Saved: students will see an “Open PDF” link. Uploading files isn't available yet."
            : "Optional. Must be an https:// link. Uploading files isn't available yet."
        }
      >
        {({ id, className, describedBy }) => (
          <input
            {...inputBase}
            id={id}
            name="pdf_url"
            type="text"
            inputMode="url"
            placeholder="https://…"
            defaultValue={value("pdf_url", lesson?.pdf_url ?? "")}
            aria-invalid={err.pdf_url ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <Field
        name="position"
        label="Order"
        error={err.position}
        hint={
          editing
            ? "1 = first. Saving a different number moves this lesson there and renumbers the others. You can also use the arrows on the course page."
            : "Optional. 1 = first. Leave blank to add this lesson at the end; a number larger than the lesson count also puts it last."
        }
      >
        {({ id, className, describedBy }) => (
          <input
            {...inputBase}
            id={id}
            name="position"
            type="text"
            inputMode="numeric"
            maxLength={5}
            defaultValue={value("position", editing && rank ? String(rank) : "")}
            aria-invalid={err.position ? true : undefined}
            aria-describedby={describedBy}
            className={className}
          />
        )}
      </Field>

      <CheckboxField
        name="published"
        label={editing ? "Published" : "Publish immediately"}
        description="Only published lessons are visible to enrolled students. The course itself must also be published."
        defaultChecked={published}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminSubmitButton>{editing ? "Save lesson" : "Create lesson"}</AdminSubmitButton>
        <Link href={backHref} className="btn-outline">
          {editing ? "Back to course" : "Cancel"}
        </Link>
      </div>
    </form>
  );
}
