"use server";

import { createClient } from "@/lib/supabase/server";
import { attachAuthors, PAGE_SIZE, type PostView } from "@/lib/posts";

export type FeedKind = "explore" | "following";
export type FeedPage = { posts: PostView[]; hasMore: boolean; error?: boolean };

/** One page of the feed, newest first. `before` is the created_at of the last post already shown. */
export async function loadFeed(kind: FeedKind, before: string | null): Promise<FeedPage> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { posts: [], hasMore: false, error: true };
  const ts = before && !Number.isNaN(Date.parse(before)) ? before : null;
  const { data, error } = await supabase.rpc(kind === "following" ? "get_feed" : "get_explore", { p_before: ts, p_limit: PAGE_SIZE + 1 });
  if (error) return { posts: [], hasMore: false, error: true };
  const rows = (data ?? []) as Parameters<typeof attachAuthors>[1];
  const posts = await attachAuthors(supabase, rows.slice(0, PAGE_SIZE), user.id);
  return { posts, hasMore: rows.length > PAGE_SIZE };
}
