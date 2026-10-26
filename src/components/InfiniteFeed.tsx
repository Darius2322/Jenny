"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "./PostCard";
import { loadFeed, type FeedKind } from "@/lib/feed-actions";
import type { PostView } from "@/lib/posts";

type Props = { kind: FeedKind; initial: PostView[]; initialHasMore: boolean; viewerId: string };

export function InfiniteFeed({ kind, initial, initialHasMore, viewerId }: Props) {
  const [posts, setPosts] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const lastRef = useRef(initial[initial.length - 1]?.created_at ?? null);

  useEffect(() => { setPosts(initial); setHasMore(initialHasMore); lastRef.current = initial[initial.length - 1]?.created_at ?? null; }, [initial, initialHasMore]);

  const more = useCallback(async () => {
    if (busy.current || !lastRef.current) return;
    busy.current = true; setLoading(true); setFailed(false);
    const page = await loadFeed(kind, lastRef.current);
    if (page.error) setFailed(true);
    else {
      setPosts((prev) => { const seen = new Set(prev.map((p) => p.id)); return [...prev, ...page.posts.filter((p) => !seen.has(p.id))]; });
      lastRef.current = page.posts[page.posts.length - 1]?.created_at ?? lastRef.current;
      setHasMore(page.hasMore);
    }
    busy.current = false; setLoading(false);
  }, [kind]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) void more(); }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, more, posts.length]);

  return (
    <>
      {posts.map((p) => <PostCard key={p.id} post={p} viewerId={viewerId} />)}
      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <div className="px-4 py-6 text-center text-sm text-muted" aria-live="polite">
        {loading && "Loading more…"}
        {failed && <button type="button" onClick={() => void more()} className="btn btn-secondary">Couldn&apos;t load more. Retry</button>}
        {!hasMore && posts.length > 0 && "You're all caught up."}
      </div>
    </>
  );
}
