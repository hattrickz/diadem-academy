import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { safeHttpsUrl } from "@/lib/media";

// Presentational course card used by the student course list and the public
// catalog. Pass `href` to make it open something; omit it for a read-only card.
export default function CourseCard({
  title,
  description,
  thumbnailUrl,
  href,
  ctaLabel = "Open course",
}: {
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  href?: string;
  ctaLabel?: string;
}) {
  // Re-validated here even though the database enforces https, so a bad
  // value can never reach an <img src>.
  const thumbnail = safeHttpsUrl(thumbnailUrl);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl2 bg-white shadow-sm ring-1 ring-navy-100">
      <div className="relative aspect-video w-full bg-skyblue-50">
        {thumbnail ? (
          // Plain <img>: thumbnails come from arbitrary hosts, which
          // next/image would require us to allow-list in next.config.js.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-skyblue-600">
            <BookOpen size={36} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-lg font-bold text-navy-800 [overflow-wrap:anywhere]">{title}</h2>
        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-navy-700/75 [overflow-wrap:anywhere]">
            {description}
          </p>
        )}
        {href && (
          <Link
            href={href}
            aria-label={`${ctaLabel}: ${title}`}
            className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-5 text-sm font-semibold text-skyblue-700 hover:text-skyblue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue-500"
          >
            {ctaLabel} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
