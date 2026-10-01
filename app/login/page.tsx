import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import FormMessage from "@/components/auth/FormMessage";

export const metadata: Metadata = {
  title: "Log In",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { reset?: string };
}) {
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Log in to access your Diadem Consult Academy account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-skyblue-600 hover:text-skyblue-700">
            Sign up
          </Link>
        </>
      }
    >
      {searchParams.reset === "success" && (
        <div className="mb-5">
          <FormMessage success="Your password has been updated. You can now log in." />
        </div>
      )}
      <LoginForm />
    </AuthCard>
  );
}