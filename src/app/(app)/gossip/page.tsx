import type { Metadata } from "next";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { GossipFeed, type GossipRow } from "@/components/GossipFeed";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "Gossip", robots: { index: false } };

export default async function GossipPage() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;
  const [{ data, error }, { data: setting }] = await Promise.all([
    supabase.rpc("gossip_list", { p_limit: 50 }),
    supabase.from("gossip_settings").select("alias").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <>
      <AutoRefresh seconds={20} />
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Gossip</h1>
      <p className="px-5 pt-1 text-sm text-muted">Posts here are anonymous: other people see only your aka, never your name. Jenny staff can look up an author only to act on a report. Harassment, hate and private information are not allowed.</p>
      <DiscoverTabs active="gossip" />
      {error && <p role="alert" className="p-4 text-sm text-red-600">We couldn&apos;t load gossip. Try again.</p>}
      <GossipFeed rows={(data ?? []) as GossipRow[]} myAlias={(setting?.alias as string | null | undefined) ?? null} />
    </>
  );
}
