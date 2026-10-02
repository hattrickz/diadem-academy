import type { Metadata } from "next";
import { requireStudent } from "@/lib/supabase/require-student";
import { formatMemberSince, getInitials } from "@/lib/profile-display";
import ProfileFields from "@/components/dashboard/student/ProfileFields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Profile",
    robots: { index: false, follow: false },
};

export default async function StudentProfilePage() {
    // Layouts aren't re-run on client-side navigation, so this page enforces
    // access itself.
    const { user, profile } = await requireStudent("/student/profile");

    const email = user.email ?? profile.email;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-navy-800 md:text-3xl">Profile</h1>

            <section
                aria-label="Your profile details"
                className="rounded-xl2 bg-white p-7 shadow-sm ring-1 ring-navy-100 md:p-9"
            >
                <div className="flex items-center gap-4">
                    <span
                        aria-hidden="true"
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xl font-bold text-white"
                    >
                        {getInitials(profile.full_name, email)}
                    </span>
                    <div className="min-w-0">
                        <p className="font-bold text-navy-800 [overflow-wrap:anywhere]">
                            {profile.full_name?.trim() || "Name not set"}
                        </p>
                        <p className="text-sm text-navy-700/75">Student</p>
                    </div>
                </div>

                <div className="mt-8 border-t border-navy-100 pt-6">
                    <ProfileFields
                        items={[
                            { label: "Full name", value: profile.full_name },
                            { label: "Email", value: email },
                            { label: "Phone", value: profile.phone },
                            { label: "Account type", value: "Student" },
                            { label: "Member since", value: formatMemberSince(profile.created_at) },
                        ]}
                    />
                </div>

                <p className="mt-8 text-sm text-navy-700/75">
                    Profile editing isn&apos;t available yet.
                </p>
            </section>
        </div>
    );
}