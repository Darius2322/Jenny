import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { login } from "@/app/auth/actions";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to your Jenny account"
      submitLabel="Sign in"
      action={login}
      hidden={{ next: safeNext(sp.next) }}
      notice={sp.error === "link" ? "That link has expired or was already used. Please try again." : undefined}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
      footer={
        <>
          <p><Link href="/forgot-password" className="font-semibold text-brand-dark underline dark:text-brand">Forgot your password?</Link></p>
          <p className="mt-2">New to Jenny? <Link href="/register" className="font-semibold text-brand-dark underline dark:text-brand">Create an account</Link></p>
        </>
      }
    />
  );
}
