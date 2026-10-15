// Lesson input validation. Pure functions; reuses the course validators'
// shared helpers (control characters, https URL check). Every value arrives from
// a browser form and is UNTRUSTED. The limits mirror the Phase 5 CHECK
// constraints (title 1-200, description <= 10000, https URLs <= 2048, position >= 0).

import {
  CONTROL_CHARS,
  LINE_BREAKS,
  charLength,
  readText,
  validateHttpsUrl,
} from "@/lib/admin/course-validation";
import { isUuid } from "@/lib/uuid";

export const LESSON_LIMITS = {
  title: 200,
  description: 10000,
  position: 99999,
} as const;

export interface LessonInput {
  title: string;
  description: string | null;
  video_url: string | null;
  pdf_url: string | null;
  /** Desired place in the course (1 = first). null = not supplied. */
  position: number | null;
  published: boolean;
}

export type ParsedLesson =
  | { ok: true; value: LessonInput }
  | { ok: false; fieldErrors: Record<string, string>; values: Record<string, string> };

export function parseLessonInput(formData: FormData): ParsedLesson {
  const raw = {
    title: readText(formData, "title").trim(),
    description: readText(formData, "description").replace(/\r\n/g, "\n").trim(),
    video_url: readText(formData, "video_url").trim(),
    pdf_url: readText(formData, "pdf_url").trim(),
    position: readText(formData, "position").trim(),
    published: formData.get("published") === "on" ? "on" : "",
  };
  const errors: Record<string, string> = {};

  // title: required, bounded, single line, no control characters
  if (!raw.title) {
    errors.title = "Title is required.";
  } else if (CONTROL_CHARS.test(raw.title) || LINE_BREAKS.test(raw.title)) {
    errors.title = "Title contains characters that aren't allowed.";
  } else if (charLength(raw.title) > LESSON_LIMITS.title) {
    errors.title = `Title must be ${LESSON_LIMITS.title} characters or fewer.`;
  }

  // description: optional, bounded, newlines allowed, no other control characters
  if (raw.description) {
    if (CONTROL_CHARS.test(raw.description)) {
      errors.description = "Description contains characters that aren't allowed.";
    } else if (charLength(raw.description) > LESSON_LIMITS.description) {
      errors.description = `Description must be ${LESSON_LIMITS.description} characters or fewer.`;
    }
  }

  // video / PDF: optional https links (the project's safeHttpsUrl rules)
  const video = validateHttpsUrl(raw.video_url, "Video link");
  if (video.error) errors.video_url = video.error;
  const pdf = validateHttpsUrl(raw.pdf_url, "PDF link");
  if (pdf.error) errors.pdf_url = pdf.error;

  // position: optional whole number >= 0 (ASCII digits only)
  let position: number | null = null;
  if (raw.position) {
    if (!/^\d{1,5}$/.test(raw.position)) {
      errors.position = `Order must be a whole number from 0 to ${LESSON_LIMITS.position}.`;
    } else {
      position = Number(raw.position);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors, values: raw };
  }
  return {
    ok: true,
    value: {
      title: raw.title,
      description: raw.description || null,
      video_url: video.value,
      pdf_url: pdf.value,
      position,
      published: raw.published === "on",
    },
  };
}

/** A uuid form field (courseId / lessonId), or null when missing/malformed. */
export function parseUuidField(formData: FormData, name: string): string | null {
  const value = readText(formData, name).trim();
  return isUuid(value) ? value : null;
}

export function parseDirection(formData: FormData, name = "direction"): "up" | "down" | null {
  const value = readText(formData, name);
  return value === "up" || value === "down" ? value : null;
}
