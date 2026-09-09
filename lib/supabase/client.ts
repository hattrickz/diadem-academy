"use client";

// Browser (client-component) Supabase client.
// Only ever uses the PUBLIC url + anon key — safe to ship to the browser.
// Never import a service-role key in this file.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them to .env.local (see docs/BACKEND.md)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
