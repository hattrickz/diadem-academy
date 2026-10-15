// Course input validation for the admin forms. Pure functions: no database or
// framework imports. Every value arrives from a browser form and is UNTRUSTED.
// The limits mirror the CHECK constraints in the Phase 5 migration, so people
// get a friendly message first and the database remains a second line of defence.

import { safeHttpsUrl } from "@/lib/media";
import { isUuid } from "@/lib/uuid";

/** Result returned by every admin course action (used with useFormState). */
export interface ActionState {
  /** A user-safe message. Never a raw database error. */
  error?: string;
  success?: string;
  /** Per-field messages keyed by the form field name. */
  fieldErrors?: Record<string, string>;
  /** Echo of the submitted text so a rejected form keeps what was typed. */
  values?: Record<string, string>;
}

export const COURSE_LIMITS = {
  title: 200,
  slug: 100,
  description: 5000,
  url: 2048,
} as const;

export interface CourseInput {
  title: string;
  slug: string;
  /** True when the slug was generated from the title (the field was blank). */
  slugWasGenerated: boolean;
  description: string | null;
  thumbnail_url: string | null;
  published: boolean;
}

export type ParsedCourse =
  | { ok: true; value: CourseInput }
  | { ok: false; fieldErrors: Record<string, string>; values: Record<string, string> };

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Control characters other than tab / newline / carriage return.
export const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
export const LINE_BREAKS = /[\r\n]/;

/** The text of a form field; a missing field or a File becomes "". */
export function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// The database counts characters (code points), not UTF-16 units.
export function charLength(value: string): number {
  return Array.from(value).length;
}

/**
 * Optional https link shared by the course thumbnail and the lesson video / PDF
 * fields. Blank -> { value: null }. Uses the project's safeHttpsUrl (https only,
 * no embedded username/password) plus length / control-character checks.
 */
export function validateHttpsUrl(raw: string, label: string): { value: string | null; error?: string } {
  if (!raw) return { value: null };
  if (CONTROL_CHARS.test(raw) || /\s/.test(raw)) {
    return { value: null, error: `${label} can't contain spaces or line breaks.` };
  }
  if (charLength(raw) > COURSE_LIMITS.url) {
    return { value: null, error: `${label} must be ${COURSE_LIMITS.url} characters or fewer.` };
  }
  const safe = safeHttpsUrl(raw);
  if (!safe || charLength(safe) > COURSE_LIMITS.url) {
    return { value: null, error: `${label} must be a valid https:// link (no username or password in it).` };
  }
  return { value: safe };
}

/** "Intro to Maths & Logic!" -> "intro-to-maths-and-logic" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, COURSE_LIMITS.slug)
    .replace(/-+$/g, "");
}

export function parseCourseInput(formData: FormData): ParsedCourse {
  const raw = {
    title: readText(formData, "title").trim(),
    slug: readText(formData, "slug").trim(),
    description: readText(formData, "description").replace(/\r\n/g, "\n").trim(),
    thumbnail_url: readText(formData, "thumbnail_url").trim(),
    published: formData.get("published") === "on" ? "on" : "",
  };
  const errors: Record<string, string> = {};

  // title
  if (!raw.title) {
    errors.title = "Title is required.";
  } else if (CONTROL_CHARS.test(raw.title) || LINE_BREAKS.test(raw.title)) {
    errors.title = "Title contains characters that aren't allowed.";
  } else if (charLength(raw.title) > COURSE_LIMITS.title) {
    errors.title = `Title must be ${COURSE_LIMITS.title} characters or fewer.`;
  }

  // slug
  let slug = raw.slug;
  let slugWasGenerated = false;
  if (!slug) {
    slugWasGenerated = true;
    slug = slugify(raw.title);
    if (!slug && !errors.title) {
      errors.slug = "Enter a URL slug using letters and numbers (one couldn't be created from the title).";
    }
  } else if (charLength(slug) > COURSE_LIMITS.slug) {
    errors.slug = `Slug must be ${COURSE_LIMITS.slug} characters or fewer.`;
  } else if (!SLUG_RE.test(slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens only (for example: intro-to-maths).";
  }

  // description
  if (raw.description) {
    if (CONTROL_CHARS.test(raw.description)) {
      errors.description = "Description contains characters that aren't allowed.";
    } else if (charLength(raw.description) > COURSE_LIMITS.description) {
      errors.description = `Description must be ${COURSE_LIMITS.description} characters or fewer.`;
    }
  }

  // thumbnail: optional https link, validated with the project's existing helper
  const thumb = validateHttpsUrl(raw.thumbnail_url, "Thumbnail link");
  if (thumb.error) errors.thumbnail_url = thumb.error;
  const thumbnail = thumb.value;

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors, values: raw };
  }
  return {
    ok: true,
    value: {
      title: raw.title,
      slug,
      slugWasGenerated,
      description: raw.description || null,
      thumbnail_url: thumbnail,
      published: raw.published === "on",
    },
  };
}

/** A uuid form field, or null when missing/malformed. */
export function parseCourseId(formData: FormData, name = "courseId"): string | null {
  const value = readText(formData, name).trim();
  return isUuid(value) ? value : null;
}

/** Strict "true" / "false"; anything else is rejected (null). */
export function parsePublishedFlag(formData: FormData, name = "published"): boolean | null {
  const value = readText(formData, name);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}
