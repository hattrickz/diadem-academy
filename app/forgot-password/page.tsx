import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset Your Password"
      subtitle="Enter the email address on your account and we'll send you a link to reset your password."
      footer={
        <>
          Remembered it after all?{" "}
          <Link href="/login" className="font-semibold text-skyblue-600 hover:text-skyblue-700">
            Back to log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
