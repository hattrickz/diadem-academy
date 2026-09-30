import "server-only";
import { headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";

/**
 * Resolves the trusted origin to use for Supabase Auth `redirectTo` /
 * `emailRedirectTo` URLs (signup confirmation, password reset, etc.).
 *
 * This is security-sensitive: whatever this returns ends up embedded in an
 * email link that, once clicked, can establish an authenticated session.
 * It deliberately does NOT trust the raw incoming `Host` /
 * `X-Forwarded-Host` request headers as its primary source — behind some
 * proxy/load-balancer configurations those headers can be influenced by
 * the client, which would otherwise make this an open-redirect /
 * host-header-injection vector for a security-sensitive URL.
 *
 * Priority order:
 *   1. `NEXT_PUBLIC_SITE_URL` — an explicitly configured, trusted origin
 *      you set in your hosting provider's environment variables (e.g.
 *      `https://diademconsult.com.ng` in production). This is the
 *      recommended way to pin the value used in production and the one
 *      that should be added to Supabase's Redirect URL allow-list.
 *   2. `VERCEL_URL` — automatically provided by Vercel for every
 *      deployment (including preview deployments), used only when
 *      `NEXT_PUBLIC_SITE_URL` isn't set. A custom production domain
 *      (via step 1) always takes priority over the `*.vercel.app` alias.
 *   3. The current request's `Host` header — used ONLY outside of
 *      production, and only when it actually looks like a local dev host
 *      (`localhost` / `127.0.0.1`). Never trusted in production.
 *   4. `siteConfig.url` — the hardcoded, known-good production domain,
 *      used as the final fallback so this function can never return a
 *      value influenced by request input alone.
 *
 * Whatever this returns must ALSO be present in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs — Supabase enforces
 * that allow-list itself regardless of what this function produces, which
 * is a second, independent layer of protection against this ever being
 * used to redirect somewhere unintended. If you want Vercel preview
 * deployments to support password reset / signup confirmation links, add
 * a matching wildcard (e.g. `https://*.vercel.app` or your own preview
 * domain pattern) to that allow-list; otherwise Supabase will safely
 * reject the redirect rather than silently allowing it.
 */
export function getRequestOrigin(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  if (process.env.NODE_ENV !== "production") {
    const headerList = headers();
    const host = headerList.get("host");
    if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
      return `http://${host}`;
    }
  }

  return siteConfig.url;
}
