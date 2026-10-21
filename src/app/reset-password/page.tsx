import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { updatePassword } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  // Only reachable through a valid recovery link (which signs the user in via /auth/callback).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <AuthForm
      title="Choose a new password"
      submitLabel="Update password"
      action={updatePassword}
      fields={[{ name: "password", label: "New password", type: "password", autoComplete: "new-password", hint: "At least 10 characters." }]}
    />
  );
}
