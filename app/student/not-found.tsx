import Link from "next/link";
import { SearchX } from "lucide-react";

// Shown for any /student/... notFound(): a course or lesson that doesn't
// exist, isn't published, or isn't available to this student. The message is
// deliberately identical in all of those cases so the URL can't be used to
// find out which courses exist.
export default function StudentNotFound() {
  return (
    <div className="flex flex-col items-center rounded-xl2 bg-white px-6 py-12 text-center shadow-sm ring-1 ring-navy-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
        <SearchX size={26} aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-navy-800">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-700/75">
        The course or lesson you&apos;re looking for doesn&apos;t exist, or it isn&apos;t
        available to your account.
      </p>
      <Link href="/student/courses" className="btn-primary mt-6">
        Back to My Courses
      </Link>
    </div>
  );
}
