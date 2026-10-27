import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { loadFeed, type FeedKind } from "@/lib/feed-actions";
import { InfiniteFeed } from "@/components/InfiniteFeed";
import { Composer } from "@/components/Composer";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ feed?: string }> }) {
  const { feed } = await searchParams;
  const kind: FeedKind = feed === "following" ? "following" : "explore";
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;
  const page = await loadFeed(kind, null);

  const tabs = [{ id: "explore", label: "For you", href: "/home" }, { id: "following", label: "Following", href: "/home?feed=following" }] as const;
  return (
    <>
      <h1 className="sr-only">Home feed</h1>
      <nav aria-label="Feed" className="flex gap-2 border-b border-line px-5 py-4 dark:border-white/10">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href} aria-current={kind === t.id ? "page" : undefined}
            className={`inline-flex min-h-[40px] items-center rounded-full px-5 text-sm font-semibold ${kind === t.id ? "bg-brand-dark text-white shadow-glow" : "bg-surface text-muted dark:bg-white/10"}`}>{t.label}</Link>
        ))}
      </nav>
      <Composer mode="post" />
      {page.error && <p role="alert" className="p-4 text-sm text-red-600">We couldn&apos;t load your feed. Check your connection and try again.</p>}
      {!page.error && page.posts.length === 0 && (
        <div className="px-6 py-14 text-center">
          <p className="text-lg font-semibold">{kind === "following" ? "Nothing from people you follow yet" : "No posts yet"}</p>
          <p className="mt-2 text-muted">Write the first post above, or find people to follow.</p>
          <Link href="/discover" className="btn btn-primary mt-5">Find people</Link>
        </div>
      )}
      <InfiniteFeed key={kind} kind={kind} initial={page.posts} initialHasMore={page.hasMore} viewerId={user.id} />
    </>
  );
}
