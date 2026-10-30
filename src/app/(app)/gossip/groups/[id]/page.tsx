import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Lock, Users } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { joinGossipGroup, leaveGossipGroup } from "@/lib/actions";
import { GossipFeed, type GossipRow } from "@/components/GossipFeed";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "Gossip group", robots: { index: false } };

type Info = { id: string; name: string; description: string | null; is_private: boolean; member_count: number; is_member: boolean; my_role: string | null; invite_code: string | null };

export default async function GroupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;
  const [{ data: info }, { data: feed }, { data: setting }] = await Promise.all([
    supabase.rpc("gossip_group_get", { p_group: id }),
    supabase.rpc("gossip_list2", { p_group: id, p_limit: 50 }),
    supabase.from("gossip_settings").select("alias").eq("user_id", user.id).maybeSingle(),
  ]);
  const g = ((info ?? []) as Info[])[0];
  if (!g) notFound();
  const admin = g.my_role === "admin";

  return (
    <>
      <AutoRefresh seconds={20} />
      <div className="px-4 pt-5"><Link href="/gossip/groups" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold dark:bg-white/10"><ArrowLeft size={16} aria-hidden="true" /> Groups</Link></div>
      <header className="px-5 pt-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">{g.name}{g.is_private && <Lock size={16} aria-label="Private group" />}</h1>
        {g.description && <p className="mt-1 text-muted">{g.description}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><Users size={15} aria-hidden="true" /> {g.member_count} {Number(g.member_count) === 1 ? "member" : "members"}{admin ? " · you are an admin" : ""}</p>
        {admin && g.invite_code && <p className="mt-3 rounded-2xl bg-brand-tint px-4 py-3 text-sm text-brand-deep dark:bg-brand/15 dark:text-brand">Invite code: <strong className="select-all font-mono text-base">{g.invite_code}</strong><span className="block text-xs">Share it only with people you want in. Anyone with the code can join.</span></p>}
        {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error === "last_admin" ? "You're the only admin. Make someone else an admin (long-press one of their posts) before leaving." : "Couldn't do that."}</p>}
        <div className="mt-3">
          {g.is_member ? (
            <form action={leaveGossipGroup}><input type="hidden" name="groupId" value={g.id} /><button type="submit" className="text-sm font-semibold text-muted underline">Leave group</button></form>
          ) : (
            <form action={joinGossipGroup}><input type="hidden" name="groupId" value={g.id} /><button type="submit" className="btn btn-primary">Join group</button></form>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">Everyone here is anonymous, admins included. Admins can long-press a post to remove it, make its author an admin, or remove its author from the group, all without seeing who it is.</p>
      </header>
      <div className="mt-3 border-t border-line dark:border-white/10" />
      <GossipFeed rows={(feed ?? []) as GossipRow[]} myAlias={(setting?.alias as string | null | undefined) ?? null} groupId={g.id} isAdmin={admin} canPost={g.is_member} />
    </>
  );
}
