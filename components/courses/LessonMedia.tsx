import { ExternalLink, FileText, PlayCircle } from "lucide-react";
import { getVideoSource, safeHttpsUrl } from "@/lib/media";

// Shows the lesson's video and/or PDF using the URLs stored in the database
// (placeholders until real media storage exists). YouTube and Vimeo links are
// embedded; any other https video URL becomes a plain external link.
export default function LessonMedia({
  title,
  videoUrl,
  pdfUrl,
}: {
  title: string;
  videoUrl: string | null;
  pdfUrl: string | null;
}) {
  const video = getVideoSource(videoUrl);
  const pdf = safeHttpsUrl(pdfUrl);

  if (!video && !pdf) {
    return (
      <p className="rounded-xl2 border-2 border-dashed border-navy-100 bg-white px-6 py-8 text-center text-sm text-navy-700/75">
        No video or PDF has been added to this lesson yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {video?.kind === "embed" && (
        <div className="aspect-video w-full overflow-hidden rounded-xl2 bg-navy-900 shadow-premium">
          <iframe
            src={video.src}
            title={`${title} — ${video.provider} video`}
            className="h-full w-full"
            loading="lazy"
            allow="fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}

      {(video?.kind === "link" || pdf) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {video?.kind === "link" && (
            <a
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <PlayCircle size={18} aria-hidden="true" /> Watch video
              <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {pdf && (
            <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <FileText size={18} aria-hidden="true" /> Open PDF
              <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
