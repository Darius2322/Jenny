import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";

export const metadata: Metadata = { title: "Account and data", robots: { index: false } };

export default async function AccountSettings() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  const { data: deletion } = await supabase.from("account_deletion_requests").select("requested_at").eq("user_id", user.id).eq("status", "requested").maybeSingle();
  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Account and data</h1>
      <section className="px-5 py-5">
        <h2 className="font-semibold">Download your data</h2>
        <p className="mt-1 text-sm text-muted">A JSON file with your profile, posts, comments, likes, reposts, follows and settings. Private messages and anonymous gossip are not included.</p>
        <a href="/settings/account/export" download className="btn btn-secondary mt-3"><Download size={18} aria-hidden="true" /> Download my data</a>
      </section>
      <DeleteAccountForm requestedAt={(deletion?.requested_at as string | undefined) ?? null} />
    </>
  );
}
