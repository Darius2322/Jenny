import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { NotificationPrefsForm } from "@/components/NotificationPrefsForm";

export const metadata: Metadata = { title: "Notification settings", robots: { index: false } };

export default async function NotificationSettings() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  const { data } = await supabase.from("user_preferences")
    .select("notify_follows, notify_reactions, notify_comments, notify_messages, notify_business_enquiries, notify_marketing").eq("user_id", user.id).maybeSingle();
  const d = data as Record<string, boolean> | null;
  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Notifications</h1>
      <p className="px-5 pt-1 text-sm text-muted">Choose which activity shows up in your notifications.</p>
      <NotificationPrefsForm prefs={{
        notify_follows: d?.notify_follows ?? true, notify_reactions: d?.notify_reactions ?? true, notify_comments: d?.notify_comments ?? true,
        notify_messages: d?.notify_messages ?? true, notify_business_enquiries: d?.notify_business_enquiries ?? true, notify_marketing: d?.notify_marketing ?? false,
      }} />
    </>
  );
}
