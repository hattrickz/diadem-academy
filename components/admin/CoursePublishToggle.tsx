"use client";

import { useFormState } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import FormMessage from "@/components/auth/FormMessage";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { setCoursePublishedAction, setCoursePublishedAsTutorAction } from "@/lib/admin/course-actions";
import type { ActionState } from "@/lib/admin/course-validation";

// Posts to a server action that re-checks the admin role. The hidden fields
// carry only the course id and the wanted state, never identity or permissions.
export default function CoursePublishToggle({
  courseId,
  published,
  area = "admin",
}: {
  courseId: string;
  published: boolean;
  /** Only picks which action to post to; each action re-checks the role on the server. */
  area?: "admin" | "tutor";
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    area === "tutor" ? setCoursePublishedAsTutorAction : setCoursePublishedAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="published" value={String(!published)} />
      <AdminSubmitButton variant="outline" compact pendingLabel="Working…">
        {published ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        {published ? "Unpublish" : "Publish"}
      </AdminSubmitButton>
      {/* Only errors are shown: on success the refreshed page is the feedback. */}
      <FormMessage error={state.error} />
    </form>
  );
}
