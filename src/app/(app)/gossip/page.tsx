import type { Metadata } from "next";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { GossipFeed, type GossipRow } from "@/components/GossipFeed";
import { AutoRefresh } from "@/components/AutoRefresh";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Gossip", robots: { index: false } };

export default async function GossipPage({ searchParams }: { searchParams: Promise<{ sort?: string; topic?: string }> }) {
  const { sort, topic } = await searchParams;
  const hot = sort === "hot";
  const topics = ["love", "campus", "work", "money", "entertainment", "sports", "politics", "random"];
  const t = topics.includes(topic ?? "") ? topic! : null;
  const href = (o: { sort?: string; topic?: string | null }) => { const q = new URLSearchParams(); const so = o.sort ?? (hot ? "hot" : ""); if (so) q.set("sort", so); const to = o.topic === undefined ? t : o.topic; if (to) q.set("topic", to); const str = q.toString(); return str ? `/gossip?${str}` : "/gossip"; };
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;
  const [{ data, error }, { data: setting }] = await Promise.all([
    supabase.rpc("gossip_list2", { p_limit: 50, p_sort: hot ? "hot" : "new", p_topic: t }),
    supabase.from("gossip_settings").select("alias").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <>
      <AutoRefresh seconds={20} />
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Gossip</h1>
      <p className="px-5 pt-1 text-sm text-muted">Posts here are anonymous: other people see only your aka, never your name. Jenny staff can look up an author only to act on a report. Harassment, hate and private information are not allowed.</p>
      <DiscoverTabs active="gossip" />
      <Link href="/gossip/groups" className="mx-4 mt-4 flex min-h-[56px] items-center gap-3 rounded-2xl bg-brand-tint px-4 font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand"><Users size={20} aria-hidden="true" /> Gossip groups<span className="ml-auto text-sm font-normal">Join or create</span></Link>
      <nav aria-label="Gossip filters" className="flex gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none]">
        {[{ l: "New", h: href({ sort: "" }), on: !hot }, { l: "Hot 🔥", h: href({ sort: "hot" }), on: hot }].map((x) => (
          <Link key={x.l} href={x.h} className={`inline-flex min-h-[36px] shrink-0 items-center rounded-full px-4 text-sm font-semibold ${x.on ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{x.l}</Link>
        ))}
        <span className="w-px shrink-0 bg-line dark:bg-white/10" />
        {topics.map((tp) => (
          <Link key={tp} href={href({ topic: t === tp ? null : tp })} className={`inline-flex min-h-[36px] shrink-0 items-center rounded-full px-3 text-sm font-semibold ${t === tp ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>#{tp}</Link>
        ))}
      </nav>
      {error && <p role="alert" className="p-4 text-sm text-red-600">We couldn&apos;t load gossip. Try again.</p>}
      <AdSlot placement="gossip" />
      <GossipFeed rows={(data ?? []) as GossipRow[]} myAlias={(setting?.alias as string | null | undefined) ?? null} />
    </>
  );
}
