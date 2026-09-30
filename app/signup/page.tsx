import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create Your Account"
      subtitle="Sign up to start your journey with Diadem Consult Academy."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-skyblue-600 hover:text-skyblue-700">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
