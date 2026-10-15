import Link from "next/link";
import { SearchX } from "lucide-react";

// Used for a malformed id, or a course or lesson that does not exist; the same message for
// both, so the URL can't be used to probe what exists.
export default function TutorNotFound() {
  return (
    <div className="flex flex-col items-center rounded-xl2 bg-white px-6 py-12 text-center shadow-sm ring-1 ring-navy-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
        <SearchX size={26} aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-navy-800">We couldn&apos;t find that</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-700/75">
        That course or lesson doesn&apos;t exist, or the link is wrong.
      </p>
      <Link href="/tutor/courses" className="btn-primary mt-6">
        Back to courses
      </Link>
    </div>
  );
}
