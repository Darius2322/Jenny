import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { register } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthForm
      title="Create your account"
      subtitle="Join Jenny. It only takes a minute."
      submitLabel="Create account"
      action={register}
      terms
      fields={[
        { name: "displayName", label: "Name", autoComplete: "name" },
        { name: "username", label: "Username", autoComplete: "username", hint: "3–30 characters: letters, numbers, underscores." },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 10 characters." },
      ]}
      footer={<p>Already have an account? <Link href="/login" className="font-semibold text-brand-dark underline dark:text-brand">Sign in</Link></p>}
    />
  );
}
