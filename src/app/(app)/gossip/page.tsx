import type { Metadata } from "next";
import { Trash2, Flag, Ghost } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteGossip, reportContent } from "@/lib/actions";
import { timeAgo } from "@/lib/posts";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { GossipComposer } from "@/components/GossipComposer";

export const metadata: Metadata = { title: "Gossip", robots: { index: false } };

type Row = { id: string; alias: string | null; body: string; created_at: string; is_mine: boolean };

export default async function GossipPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("gossip_feed", { p_limit: 50 });
  const rows = (data ?? []) as Row[];
  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Gossip</h1>
      <p className="px-5 pt-1 text-sm text-muted">Posts here are anonymous: other people see only your aka, never your name. Jenny staff can look up an author only to act on a report. Harassment, hate and private information are not allowed.</p>
      <DiscoverTabs active="gossip" />
      <GossipComposer />
      {error && <p role="alert" className="p-4 text-sm text-red-600">We couldn&apos;t load gossip. Try again.</p>}
      {!error && rows.length === 0 && <p className="px-6 py-14 text-center text-muted">Nothing yet. Be the first to post.</p>}
      {rows.map((g) => (
        <article key={g.id} className="border-b border-line px-4 py-4 dark:border-white/10">
          <header className="flex items-center gap-3 text-sm">
            <span className="chip !h-10 !w-10"><Ghost size={18} aria-hidden="true" /></span>
            <span className="font-semibold">{g.alias ?? "Anonymous"}</span>
            {g.is_mine && <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted dark:bg-white/10">You</span>}
            <time dateTime={g.created_at} className="text-muted">· {timeAgo(g.created_at)}</time>
          </header>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px]">{g.body}</p>
          <div className="mt-1 flex justify-end">
            {g.is_mine ? (
              <form action={deleteGossip}><input type="hidden" name="id" value={g.id} />
                <button type="submit" aria-label="Delete gossip" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><Trash2 size={18} aria-hidden="true" /></button></form>
            ) : (
              <form action={reportContent}>
                <input type="hidden" name="targetType" value="gossip" /><input type="hidden" name="targetId" value={g.id} /><input type="hidden" name="reason" value="other" />
                <button type="submit" aria-label="Report gossip" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><Flag size={18} aria-hidden="true" /></button>
              </form>
            )}
          </div>
        </article>
      ))}
    </>
  );
}
