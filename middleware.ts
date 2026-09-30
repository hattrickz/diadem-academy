import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, UserRole } from "@/lib/supabase/database.types";

// Refreshes the Supabase auth session cookie on every request so server
// components always see an up-to-date session, AND gates access to the
// role-specific dashboards added in Phase 3 (/student, /tutor, /admin).
//
// This is defense-in-depth alongside the authorization check each
// dashboard page performs itself in getUserWithProfile() — neither one
// alone is assumed sufficient; both check the real Supabase session/role,
// never anything supplied by the browser.
//
// If either Supabase env var is missing (e.g. this repo hasn't been wired
// to a project yet), the middleware safely no-ops instead of breaking the
// public website — this was verified with the production build running
// and no Supabase env vars set.
const PROTECTED_PREFIXES = ["/student", "/tutor", "/admin"] as const;

function roleHome(role: UserRole | undefined): string {
  if (role === "tutor") return "/tutor";
  if (role === "admin") return "/admin";
  return "/student";
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request: { headers: request.headers } });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const matchedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (matchedPrefix) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role comes from the database via the authenticated session — never
    // from a query param, cookie value, or anything else the client sent.
    // NOTE: .single<{ role: UserRole }>() — see the matching note in
    // lib/auth/actions.ts for why this explicit generic is required.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();

    const home = roleHome(profile?.role);
    if (`/${matchedPrefix.slice(1)}` !== home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

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
