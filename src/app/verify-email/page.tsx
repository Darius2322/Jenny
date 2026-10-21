import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo size={40} />
      <MailCheck size={36} className="text-brand-dark dark:text-brand" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="text-muted">Open the verification link we sent you to finish creating your account. The link works once and expires.</p>
      <Link href="/login" className="btn btn-secondary">Back to sign in</Link>
    </main>
  );
}
