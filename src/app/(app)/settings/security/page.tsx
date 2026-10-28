import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserCached } from "@/lib/supabase/server";
import { signOutEverywhere } from "@/lib/actions";
import { PasswordForm } from "@/components/PasswordForm";

export const metadata: Metadata = { title: "Security", robots: { index: false } };

export default async function SecuritySettings() {
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Security</h1>
      <p className="px-5 pt-1 text-sm text-muted">Email: {user.email}</p>
      <h2 className="px-5 pt-5 font-semibold">Change password</h2>
      <PasswordForm />
      <section className="border-t border-line px-5 py-5 dark:border-white/10">
        <h2 className="font-semibold">Sign out everywhere</h2>
        <p className="mt-1 text-sm text-muted">Ends your session on every phone and browser, including this one.</p>
        <form action={signOutEverywhere}><button type="submit" className="btn btn-secondary mt-3">Sign out of all devices</button></form>
      </section>
    </>
  );
}
