import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { joinGossipGroup } from "@/lib/actions";
import { CreateGroupForm, JoinCodeForm } from "@/components/GroupForms";

export const metadata: Metadata = { title: "Gossip groups", robots: { index: false } };

type G = { id: string; name: string; description: string | null; is_private: boolean; member_count: number; is_member: boolean; my_role: string | null };

export default async function GossipGroups({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("gossip_groups_list");
  const groups = (data ?? []) as G[];
  const mine = groups.filter((g) => g.is_member);
  const others = groups.filter((g) => !g.is_member);
  const card = (g: G) => (
    <li key={g.id} className="flex items-center gap-3 px-4 py-3">
      <span className="chip"><Users size={20} aria-hidden="true" /></span>
      <Link href={`/gossip/groups/${g.id}`} className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold"><span className="truncate">{g.name}</span>{g.is_private && <Lock size={13} aria-label="Private" />}{g.my_role === "admin" && <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs text-brand-deep dark:bg-brand/15 dark:text-brand">Admin</span>}</span>
        <span className="block truncate text-sm text-muted">{g.member_count} {Number(g.member_count) === 1 ? "member" : "members"}{g.description ? ` · ${g.description}` : ""}</span>
      </Link>
      {!g.is_member && <form action={joinGossipGroup}><input type="hidden" name="groupId" value={g.id} /><button type="submit" className="btn btn-secondary !min-h-[40px]">Join</button></form>}
    </li>
  );
  return (
    <>
      <div className="px-4 pt-5"><Link href="/gossip" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold dark:bg-white/10"><ArrowLeft size={16} aria-hidden="true" /> Gossip</Link></div>
      <h1 className="px-5 pt-4 text-2xl font-extrabold">Gossip groups</h1>
      <p className="px-5 pt-1 text-sm text-muted">Small anonymous spaces run by their own admins.</p>
      {error && <p role="alert" className="mx-5 mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">You couldn&apos;t join that group.</p>}
      {mine.length > 0 && <section aria-label="My groups"><h2 className="eyebrow px-5 pb-1 pt-5">My groups</h2><ul className="divide-y divide-line dark:divide-white/10">{mine.map(card)}</ul></section>}
      {others.length > 0 && <section aria-label="Discover groups"><h2 className="eyebrow px-5 pb-1 pt-5">Discover</h2><ul className="divide-y divide-line dark:divide-white/10">{others.map(card)}</ul></section>}
      {groups.length === 0 && <p className="px-6 py-10 text-center text-muted">No groups yet. Create the first one below.</p>}
      <section className="mx-5 mt-6 border-t border-line pt-5 dark:border-white/10"><JoinCodeForm /></section>
      <section className="mx-5 mb-8 mt-6 border-t border-line pt-5 dark:border-white/10"><h2 className="font-bold">Create a group</h2><div className="mt-3"><CreateGroupForm /></div></section>
    </>
  );
}
