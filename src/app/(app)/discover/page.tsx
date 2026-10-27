import type { Metadata } from "next";
import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { DiscoverTabs } from "@/components/DiscoverTabs";

export const metadata: Metadata = { title: "Discover", robots: { index: false } };

type Found = { id: string; username: string; display_name: string; avatar_path: string | null; visibility: string };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 50);
  const tagQ = query.replace(/^#/, "").toLowerCase();
  if (query.startsWith("#") && /^[a-z0-9_]{2,40}$/.test(tagQ)) redirect(`/tag/${tagQ}`);
  const supabase = await createClient();
  const { data: trendData } = await supabase.rpc("trending_tags", { p_hours: 168, p_limit: 10 });
  const trending = (trendData ?? []) as { tag: string; uses: number }[];

  let results: Found[] = [];
  let failed = false;
  if (query.length >= 2) {
    const { data, error } = await supabase.rpc("search_profiles", { q: query, lim: 20, off: 0 });
    if (error) failed = true; else results = (data ?? []) as Found[];
  }

  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Discover</h1>
      <DiscoverTabs active="people" />
      <form action="/discover" role="search" className="flex gap-2 border-b border-line px-4 py-4 dark:border-white/10">
        <label htmlFor="q" className="sr-only">Search people by name or username</label>
        <input id="q" name="q" type="search" defaultValue={query} placeholder="Search people or #hashtags" className="field" autoComplete="off" />
        <button type="submit" className="btn btn-primary" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
      </form>

      {query.length < 2 && (
        <section aria-label="Trending" className="px-5 py-5">
          <h2 className="eyebrow flex items-center gap-2"><TrendingUp size={16} aria-hidden="true" /> Trending this week</h2>
          {trending.length === 0 ? <p className="mt-3 text-sm text-muted">No hashtags yet. Add one to a post, like #nairobi, and it will show up here.</p> : (
            <ol className="mt-3 divide-y divide-line dark:divide-white/10">
              {trending.map((t, i) => (
                <li key={t.tag}>
                  <Link href={`/tag/${t.tag}`} className="flex min-h-[52px] items-center gap-3 hover:bg-surface dark:hover:bg-white/5">
                    <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                    <span className="flex-1 font-semibold">#{t.tag}</span>
                    <span className="text-xs text-muted">{t.uses} {Number(t.uses) === 1 ? "post" : "posts"}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-sm text-muted">Or type at least 2 characters to search people by name or username.</p>
        </section>
      )}
      {failed && <p role="alert" className="p-4 text-sm text-red-600">Search is unavailable right now. Please try again.</p>}
      {query.length >= 2 && !failed && results.length === 0 && <p className="px-4 py-8 text-center text-muted">No people found for “{query}”.</p>}

      <ul>
        {results.map((p) => (
          <li key={p.id} className="border-b border-line dark:border-white/10">
            <Link href={`/u/${p.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface dark:hover:bg-white/5">
              <Avatar name={p.display_name} path={p.avatar_path} size={44} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{p.display_name}</span>
                <span className="block truncate text-sm text-muted">@{p.username}{p.visibility === "followers" ? " · Private" : ""}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
