import type { SupabaseClient } from "@supabase/supabase-js";
import { publicUrl } from "@/lib/upload";

export type Author = { id: string; username: string; display_name: string; avatar_path: string | null };

export type PostView = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  reaction_count: number;
  comment_count: number;
  my_reaction: string | null;
  images: string[];
  author: Author | null;
};

export const PAGE_SIZE = 20;

type RawPost = {
  id: string; author_id: string; body: string; created_at: string; edited_at: string | null;
  reaction_count?: number; comment_count?: number; my_reaction?: string | null;
};

/** Looks up authors (through RLS: hidden/blocked profiles simply come back as null). */
export async function attachAuthors(supabase: SupabaseClient, rows: RawPost[]): Promise<PostView[]> {
  const ids = [...new Set(rows.map((r) => r.author_id))];
  const map = new Map<string, Author>();
  if (ids.length) {
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_path").in("id", ids);
    (data ?? []).forEach((p: Author) => map.set(p.id, p));
  }
  const images = new Map<string, string[]>();
  if (rows.length) {
    const { data: media } = await supabase.from("post_media").select("post_id, storage_path, position")
      .in("post_id", rows.map((r) => r.id)).order("position", { ascending: true });
    (media ?? []).forEach((m: { post_id: string; storage_path: string }) => {
      images.set(m.post_id, [...(images.get(m.post_id) ?? []), publicUrl("post-media", m.storage_path)]);
    });
  }
  return rows.map((r) => ({
    id: r.id, author_id: r.author_id, body: r.body, created_at: r.created_at, edited_at: r.edited_at,
    reaction_count: Number(r.reaction_count ?? 0), comment_count: Number(r.comment_count ?? 0),
    my_reaction: r.my_reaction ?? null, images: images.get(r.id) ?? [], author: map.get(r.author_id) ?? null,
  }));
}

type CountRow = { id: string; author_id: string; body: string; created_at: string; edited_at: string | null;
  reactions: { count: number }[]; comments: { count: number }[] };

/** Posts by one author or a single post, with counts and the viewer's own reaction. */
export async function queryPosts(
  supabase: SupabaseClient, viewerId: string,
  opts: { authorId?: string; postId?: string; before?: string | null },
): Promise<PostView[]> {
  let q = supabase
    .from("posts")
    .select("id, author_id, body, created_at, edited_at, reactions(count), comments(count)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (opts.authorId) q = q.eq("author_id", opts.authorId);
  if (opts.postId) q = q.eq("id", opts.postId);
  if (opts.before) q = q.lt("created_at", opts.before);
  const { data } = await q;
  const rows = (data ?? []) as CountRow[];

  const mine = new Map<string, string>();
  if (rows.length) {
    const { data: rx } = await supabase.from("reactions").select("post_id, kind").eq("user_id", viewerId).in("post_id", rows.map((r) => r.id));
    (rx ?? []).forEach((r: { post_id: string; kind: string }) => mine.set(r.post_id, r.kind));
  }
  return attachAuthors(supabase, rows.map((r) => ({
    id: r.id, author_id: r.author_id, body: r.body, created_at: r.created_at, edited_at: r.edited_at,
    reaction_count: r.reactions[0]?.count ?? 0, comment_count: r.comments[0]?.count ?? 0, my_reaction: mine.get(r.id) ?? null,
  })));
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
