import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { z } from "zod";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { queryPosts, timeAgo, type Author } from "@/lib/posts";
import { deleteComment } from "@/lib/actions";
import { PostCard } from "@/components/PostCard";
import { Composer } from "@/components/Composer";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "Post", robots: { index: false } };

type Comment = { id: string; author_id: string; body: string; created_at: string; parent_id: string | null };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;

  const [post] = await queryPosts(supabase, user.id, { postId: id });
  if (!post) notFound(); // RLS hides posts the viewer may not see

  const { data: rows } = await supabase
    .from("comments").select("id, author_id, body, created_at, parent_id")
    .eq("post_id", id).eq("status", "published").order("created_at", { ascending: true }).limit(200);
  const comments = (rows ?? []) as Comment[];

  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const authors = new Map<string, Author>();
  if (authorIds.length) {
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_path").in("id", authorIds);
    (data ?? []).forEach((a: Author) => authors.set(a.id, a));
  }

  const top = comments.filter((c) => !c.parent_id || !comments.some((x) => x.id === c.parent_id));
  const replies = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parent_id && comments.some((x) => x.id === c.parent_id)) replies.set(c.parent_id, [...(replies.get(c.parent_id) ?? []), c]);
  });

  function CommentRow({ c, small = false }: { c: Comment; small?: boolean }) {
    const a = authors.get(c.author_id);
    return (
      <div className="flex gap-3 px-4 py-3">
        {a ? <Link href={`/u/${a.username}`} aria-label={`View ${a.display_name}'s profile`} className="shrink-0 self-start"><Avatar name={a.display_name} path={a.avatar_path} size={small ? 28 : 32} /></Link> : <Avatar name="?" path={null} size={small ? 28 : 32} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            {a ? <Link href={`/u/${a.username}`} className="font-semibold hover:underline">{a.display_name}</Link> : <span className="font-semibold text-muted">Unavailable user</span>}
            <span className="text-muted"> · {timeAgo(c.created_at)}</span>
          </p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{c.body}</p>
        </div>
        {c.author_id === user!.id && (
          <form action={deleteComment}>
            <input type="hidden" name="commentId" value={c.id} />
            <input type="hidden" name="postId" value={post!.id} />
            <button type="submit" aria-label="Delete comment" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface dark:hover:bg-white/10"><Trash2 size={16} aria-hidden="true" /></button>
          </form>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-2 py-2 dark:border-white/10">
        <Link href="/home" aria-label="Back to home" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <h1 className="text-lg font-bold">Post</h1>
      </div>

      <PostCard post={post} viewerId={user.id} detail />
      <Composer mode="comment" postId={post.id} placeholder="Write a comment" />

      <section aria-label="Comments">
        {comments.length === 0 && <p className="px-4 py-8 text-center text-muted">No comments yet. Be the first to comment.</p>}
        <ul>
          {top.map((c) => (
            <li key={c.id} className="border-b border-line dark:border-white/10">
              <CommentRow c={c} />
              {(replies.get(c.id) ?? []).length > 0 && (
                <ul className="ml-8 border-l border-line dark:border-white/10">
                  {(replies.get(c.id) ?? []).map((r) => <li key={r.id}><CommentRow c={r} small /></li>)}
                </ul>
              )}
              <details className="px-4 pb-3 pl-14">
                <summary className="cursor-pointer text-sm font-medium text-brand-dark dark:text-brand">Reply</summary>
                <Composer mode="comment" postId={post.id} parentId={c.id} placeholder="Write a reply" />
              </details>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
