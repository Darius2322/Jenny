import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { attachAuthors, PAGE_SIZE } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export const metadata: Metadata = { title: "Hashtag", robots: { index: false } };

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const clean = decodeURIComponent(tag).toLowerCase();
  if (!/^[a-z0-9_]{2,40}$/.test(clean)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;
  const { data } = await supabase.rpc("posts_by_tag", { p_tag: clean, p_limit: PAGE_SIZE });
  const posts = await attachAuthors(supabase, (data ?? []) as Parameters<typeof attachAuthors>[1], user.id);
  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-5">
        <Link href="/discover" aria-label="Back" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface dark:bg-white/10"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <h1 className="text-2xl font-extrabold">#{clean}</h1>
      </div>
      {posts.length === 0 && <p className="px-6 py-14 text-center text-muted">No posts with this hashtag yet.</p>}
      <div className="mt-3">{posts.map((p) => <PostCard key={p.id} post={p} viewerId={user.id} />)}</div>
    </>
  );
}
