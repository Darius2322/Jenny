import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { DiscoverTabs } from "@/components/DiscoverTabs";

export const metadata: Metadata = { title: "Discover", robots: { index: false } };

type Found = { id: string; username: string; display_name: string; avatar_path: string | null; visibility: string };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 50);
  const supabase = await createClient();

  let results: Found[] = [];
  let failed = false;
  if (query.length >= 2) {
    const { data, error } = await supabase.rpc("search_profiles", { q: query, lim: 20, off: 0 });
    if (error) failed = true; else results = (data ?? []) as Found[];
  }

  return (
    <>
      <h1 className="px-4 pt-5 text-xl font-bold">Discover</h1>
      <DiscoverTabs active="people" />
      <form action="/discover" role="search" className="flex gap-2 border-b border-line px-4 py-4 dark:border-white/10">
        <label htmlFor="q" className="sr-only">Search people by name or username</label>
        <input id="q" name="q" type="search" defaultValue={query} placeholder="Search people" className="field" autoComplete="off" />
        <button type="submit" className="btn btn-primary" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
      </form>

      {query.length < 2 && <p className="px-4 py-8 text-center text-muted">Type at least 2 characters to search for people by name or username.</p>}
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
