import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/posts";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { NewsForm } from "@/components/NewsForm";

export const metadata: Metadata = { title: "News", robots: { index: false } };

type Item = { id: string; title: string; summary: string; source_url: string | null; label: string; status: string; reviewed_at: string | null; created_at: string };

const labels: Record<string, { text: string; cls: string }> = {
  sourced_news: { text: "Sourced news", cls: "bg-brand/15 text-brand-dark dark:text-brand" },
  opinion: { text: "Opinion", cls: "bg-surface text-ink dark:bg-white/10 dark:text-white" },
  rumor_unverified: { text: "Unverified / rumour", cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
  unverified_submission: { text: "Community submission, unverified", cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
};

export default async function NewsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("news_submissions")
    .select("id, title, summary, source_url, label, status, reviewed_at, created_at")
    .in("status", ["published", "corrected"]).order("reviewed_at", { ascending: false, nullsFirst: false }).limit(30);
  const items = (data ?? []) as Item[];

  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Discover</h1>
      <DiscoverTabs active="news" />
      <NewsForm />
      {error && <p role="alert" className="p-4 text-sm text-red-600">Couldn&apos;t load news. Please try again.</p>}
      {!error && items.length === 0 && <p className="px-6 py-12 text-center text-muted">No stories published yet. Stories appear here after review.</p>}
      <ul>
        {items.map((n) => {
          const l = labels[n.label] ?? labels.unverified_submission!;
          return (
            <li key={n.id} className="border-b border-line px-4 py-4 dark:border-white/10">
              <p className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-semibold ${l.cls}`}>{l.text}</span>
                {n.status === "corrected" && <span className="rounded-full bg-surface px-2.5 py-0.5 font-semibold dark:bg-white/10">Corrected</span>}
                <span className="text-muted">{timeAgo(n.reviewed_at ?? n.created_at)}</span>
              </p>
              <h2 className="mt-2 font-semibold">{n.title}</h2>
              <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{n.summary}</p>
              {n.source_url && <p className="mt-2 text-sm"><a href={n.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">Read the original source</a></p>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
