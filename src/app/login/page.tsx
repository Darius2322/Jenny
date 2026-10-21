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
      title="Sign in to Jenny"
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
          <p><Link href="/forgot-password" className="underline">Forgot your password?</Link></p>
          <p className="mt-2">New to Jenny? <Link href="/register" className="font-semibold text-ink underline dark:text-white">Create an account</Link></p>
        </>
      }
    />
  );
}
