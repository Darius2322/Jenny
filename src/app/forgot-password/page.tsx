import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { requestPasswordReset } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="Reset your password"
      submitLabel="Send reset link"
      action={requestPasswordReset}
      fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      footer={<p><Link href="/login" className="underline">Back to sign in</Link></p>}
    />
  );
}
