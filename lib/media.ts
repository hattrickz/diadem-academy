// Helpers for rendering the placeholder media URLs stored on courses/lessons.
//
// The database already requires https:// for these columns, but the app does
// not rely on that alone: every URL is re-parsed here before it is used in an
// href / src, and video embeds are limited to an explicit allow-list of hosts
// so an arbitrary stored URL can never become an <iframe>.

// Matches an "@" inside the authority part (everything between "https://" and
// the first "/", "?" or "#"), i.e. embedded credentials like
// https://user:pass@host/ — checked on the RAW string because the URL parser
// treats some odd forms (backslashes, empty userinfo) differently from the
// database CHECK constraint. An "@" later in the path or query is fine.
const EMBEDDED_CREDENTIALS = /^\s*https:\/\/[^/?#]*@/i;

/**
 * Returns the URL only if it parses, uses https and carries no embedded
 * username/password; otherwise null. Credentials in a URL are a classic way to
 * disguise the real host (https://trusted.com@evil.com/) and are never
 * legitimate for course media.
 */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (EMBEDDED_CREDENTIALS.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username !== "" || url.password !== "") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export type VideoSource =
  | { kind: "embed"; provider: "YouTube" | "Vimeo"; src: string }
  | { kind: "link"; href: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{5,12}$/;

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const [, kind, maybeId] = url.pathname.split("/");
      if (kind === "embed" || kind === "shorts" || kind === "live") id = maybeId ?? null;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  let id: string | null = null;

  if (host === "vimeo.com") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "player.vimeo.com") {
    const [, kind, maybeId] = url.pathname.split("/");
    if (kind === "video") id = maybeId ?? null;
  }
  return id && VIMEO_ID.test(id) ? id : null;
}

/**
 * Turns a stored video URL into either a vetted embed (YouTube/Vimeo only)
 * or a plain external link. Anything that is not a valid https URL yields null.
 */
export function getVideoSource(value: string | null | undefined): VideoSource | null {
  const safe = safeHttpsUrl(value);
  if (!safe) return null;

  const url = new URL(safe);

  const yt = youtubeId(url);
  if (yt) {
    return { kind: "embed", provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${yt}` };
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return { kind: "embed", provider: "Vimeo", src: `https://player.vimeo.com/video/${vimeo}` };
  }
  return { kind: "link", href: safe };
}
