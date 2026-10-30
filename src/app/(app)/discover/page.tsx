import type { Metadata } from "next";
import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { attachAuthors } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { AdSlot } from "@/components/AdSlot";

export const metadata: Metadata = { title: "Discover", robots: { index: false } };

type Found = { id: string; username: string; display_name: string; avatar_path: string | null; visibility: string };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 50);
  const tagQ = query.replace(/^#/, "").toLowerCase();
  if (query.startsWith("#") && /^[a-z0-9_]{2,40}$/.test(tagQ)) redirect(`/tag/${tagQ}`);
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;
  const searching = query.length >= 2;

  // Search results, or (when not searching) the people who are on Jenny and the latest posts, loaded in parallel.
  const [peopleRes, postsRes, trendRes] = await Promise.all([
    searching
      ? supabase.rpc("search_profiles", { q: query, lim: 20, off: 0 })
      : supabase.from("profiles").select("id, username, display_name, avatar_path, visibility, bio").eq("discoverable", true).neq("id", user.id).order("created_at", { ascending: false }).limit(12),
    searching ? Promise.resolve({ data: [] }) : supabase.rpc("get_explore", { p_limit: 10 }),
    searching ? Promise.resolve({ data: [] }) : supabase.rpc("trending_tags", { p_hours: 168, p_limit: 8 }),
  ]);
  const failed = !!peopleRes.error;
  const people = (peopleRes.data ?? []) as Found[];
  const trending = (trendRes.data ?? []) as { tag: string; uses: number }[];
  const posts = await attachAuthors(supabase, (postsRes.data ?? []) as Parameters<typeof attachAuthors>[1], user.id);

  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Discover</h1>
      <DiscoverTabs active="people" />
      {!searching && <AdSlot placement="discover" />}
      <form action="/discover" role="search" className="flex gap-2 border-b border-line px-4 py-4 dark:border-white/10">
        <label htmlFor="q" className="sr-only">Search people or hashtags</label>
        <input id="q" name="q" type="search" defaultValue={query} placeholder="Search people or #hashtags" className="field" autoComplete="off" />
        <button type="submit" className="btn btn-primary" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
      </form>

      {failed && <p role="alert" className="p-4 text-sm text-red-600">Discover is unavailable right now. Please try again.</p>}

      {!searching && trending.length > 0 && (
        <nav aria-label="Trending hashtags" className="flex gap-2 overflow-x-auto px-4 py-3">
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-dark dark:text-brand"><TrendingUp size={14} aria-hidden="true" /> Trending</span>
          {trending.map((t) => <Link key={t.tag} href={`/tag/${t.tag}`} className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold dark:bg-white/10">#{t.tag}</Link>)}
        </nav>
      )}

      <section aria-label="People">
        <h2 className="eyebrow px-5 pb-1 pt-4">{searching ? `People matching “${query}”` : "People on Jenny"}</h2>
        {people.length === 0 && !failed && <p className="px-5 py-6 text-center text-muted">{searching ? "No people found." : "No one else has joined yet. Invite a friend!"}</p>}
        <ul>
          {people.map((p) => (
            <li key={p.id} className="border-b border-line dark:border-white/10">
              <Link href={`/u/${p.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface dark:hover:bg-white/5">
                <Avatar name={p.display_name} path={p.avatar_path} size={46} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.display_name}</span>
                  <span className="block truncate text-sm text-muted">@{p.username}{p.visibility === "followers" ? " · Private" : ""}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!searching && (
        <section aria-label="Posts">
          <h2 className="eyebrow px-5 pb-1 pt-5">Latest posts</h2>
          {posts.length === 0 && <p className="px-5 py-6 text-center text-muted">No posts yet.</p>}
          {posts.map((p) => <PostCard key={p.id} post={p} viewerId={user.id} />)}
        </section>
      )}
    </>
  );
}
