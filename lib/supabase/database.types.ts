// Minimal hand-written types for the Phase 2 schema.
// Once the Supabase CLI can reach the real project from an environment with
// network access, prefer generating this file instead:
//
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
//
// This hand-written version exists so the app has type safety now without
// requiring a live connection.

export type UserRole = "student" | "tutor" | "admin";

export interface Profile {
  id: string; // uuid, references auth.users.id
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, "id" | "role">>;
        // `role` is intentionally excluded from client-side Update — role
        // changes are blocked by the prevent_role_self_update trigger and
        // must go through server-side code using the service-role key.
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
