import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request so server
// components always see an up-to-date session. This does NOT gate access
// to any route in Phase 2 — no /student, /tutor or /admin routes exist yet,
// so this middleware is currently a no-op in terms of blocking anything.
// It only keeps the session cookie fresh for when those routes are added.
//
// If either Supabase env var is missing (e.g. this repo hasn't been wired
// to a project yet), the middleware safely no-ops instead of breaking the
// public website.
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request: { headers: request.headers } });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and image optimization files so the middleware
     * only runs on actual page/route requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|logo.png).*)",
  ],
};
