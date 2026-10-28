import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { toggleBlock } from "@/lib/actions";
import { Avatar } from "@/components/Avatar";
import { GossipAliasForm } from "@/components/GossipAliasForm";

export const metadata: Metadata = { title: "Privacy settings", robots: { index: false } };

export default async function PrivacySettings() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  const [{ data: blocks }, { data: gs }, { data: me }] = await Promise.all([
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id),
    supabase.from("gossip_settings").select("alias").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("visibility, discoverable").eq("id", user.id).single(),
  ]);
  const ids = ((blocks ?? []) as { blocked_id: string }[]).map((b) => b.blocked_id);
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, username, display_name, avatar_path").in("id", ids) : { data: [] };

  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Privacy and safety</h1>
      <section className="px-5 pt-4">
        <p className="text-sm text-muted">Your profile is <strong>{me?.visibility === "followers" ? "private (followers only)" : "public"}</strong> and you are <strong>{me?.discoverable ? "listed" : "not listed"}</strong> in search. <Link href="/settings/profile" className="font-semibold text-brand-dark underline dark:text-brand">Change</Link></p>
      </section>
      <div className="mt-4"><GossipAliasForm alias={(gs?.alias as string | null | undefined) ?? null} /></div>
      <section className="px-5 py-5" aria-labelledby="blocked-h">
        <h2 id="blocked-h" className="font-semibold">Blocked people</h2>
        <p className="mt-1 text-sm text-muted">Blocked people can&apos;t see your profile, follow you, DM you or appear in your dating.</p>
        {(people ?? []).length === 0 ? <p className="mt-3 text-sm text-muted">You haven&apos;t blocked anyone.</p> : (
          <ul className="mt-3 divide-y divide-line dark:divide-white/10">
            {(people ?? []).map((p: { id: string; username: string; display_name: string; avatar_path: string | null }) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Avatar name={p.display_name} path={p.avatar_path} size={40} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.display_name}</span><span className="block truncate text-sm text-muted">@{p.username}</span></span>
                <form action={toggleBlock}><input type="hidden" name="targetId" value={p.id} /><button type="submit" className="btn btn-secondary !min-h-[40px]">Unblock</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="px-5 pb-6"><h2 className="font-semibold">Dating</h2><p className="mt-1 text-sm text-muted">Pause or edit your dating profile any time.</p><Link href="/dating?tab=profile" className="btn btn-secondary mt-3">Dating settings</Link></section>
    </>
  );
}
