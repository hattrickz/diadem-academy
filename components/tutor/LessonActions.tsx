"use client";

import { useFormState } from "react-dom";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { moveLessonAction, setLessonPublishedAction } from "@/lib/tutor/lesson-actions";
import type { ActionState } from "@/lib/admin/course-validation";

// Small single-purpose forms. Each posts to a server action that re-checks the
// caller's role; the hidden fields carry only ids and the wanted value, never
// identity or permissions. Only errors are shown: on success the refreshed page
// is the feedback.

export function LessonPublishToggle({
  courseId,
  lessonId,
  published,
}: {
  courseId: string;
  lessonId: string;
  published: boolean;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(setLessonPublishedAction, {});
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="published" value={String(!published)} />
      <AdminSubmitButton variant="outline" compact pendingLabel="Working…">
        {published ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        {published ? "Unpublish" : "Publish"}
      </AdminSubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}

export function LessonMoveButton({
  courseId,
  lessonId,
  direction,
  disabled,
  lessonTitle,
}: {
  courseId: string;
  lessonId: string;
  direction: "up" | "down";
  /** Cosmetic only (first / last lesson); the server handles the edge cases itself. */
  disabled: boolean;
  lessonTitle: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(moveLessonAction, {});
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={`Move “${lessonTitle}” ${direction}`}
        className="btn-outline min-h-[44px] !px-4 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon size={16} aria-hidden="true" />
        <span className="sr-only">Move {direction}</span>
      </button>
      <FormMessage error={state.error} />
    </form>
  );
}
