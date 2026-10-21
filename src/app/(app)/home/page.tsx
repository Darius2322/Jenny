import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { attachAuthors, PAGE_SIZE } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { Composer } from "@/components/Composer";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const { before } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const beforeTs = before && !Number.isNaN(Date.parse(before)) ? before : null;
  const { data, error } = await supabase.rpc("get_feed", { p_before: beforeTs, p_limit: PAGE_SIZE + 1 });
  const rows = (data ?? []) as Parameters<typeof attachAuthors>[1];
  const hasMore = rows.length > PAGE_SIZE;
  const posts = await attachAuthors(supabase, rows.slice(0, PAGE_SIZE));
  const last = posts[posts.length - 1];

  return (
    <>
      <h1 className="sr-only">Home feed</h1>
      {!beforeTs && <Composer mode="post" />}

      {error && <p role="alert" className="p-4 text-sm text-red-600">We couldn&apos;t load your feed. Check your connection and try again.</p>}

      {!error && posts.length === 0 && !beforeTs && (
        <div className="px-6 py-14 text-center">
          <p className="text-lg font-semibold">Your feed is empty</p>
          <p className="mt-2 text-muted">Posts from you and the people you follow appear here. Write your first post above, or find people to follow.</p>
          <Link href="/discover" className="btn btn-primary mt-5">Find people</Link>
        </div>
      )}

      {posts.map((p) => <PostCard key={p.id} post={p} viewerId={user.id} />)}

      {hasMore && last && (
        <div className="p-4 text-center">
          <Link href={`/home?before=${encodeURIComponent(last.created_at)}`} className="btn btn-secondary">Load older posts</Link>
        </div>
      )}
    </>
  );
}
