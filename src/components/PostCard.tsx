import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Trash2, Flag } from "lucide-react";
import { Avatar } from "./Avatar";
import { deletePost, toggleReaction, reportContent } from "@/lib/actions";
import { timeAgo, type PostView } from "@/lib/posts";

export function PostCard({ post, viewerId, detail = false }: { post: PostView; viewerId: string; detail?: boolean }) {
  const author = post.author;
  const mine = post.author_id === viewerId;
  const liked = post.my_reaction !== null;

  return (
    <article className="border-b border-line px-4 py-4 dark:border-white/10">
      <div className="flex gap-3">
        <Avatar name={author?.display_name ?? "?"} path={author?.avatar_path} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {author ? (
              <Link href={`/u/${author.username}`} className="font-semibold hover:underline">{author.display_name}</Link>
            ) : (
              <span className="font-semibold text-muted">Unavailable user</span>
            )}
            {author && <span className="text-muted">@{author.username}</span>}
            <Link href={`/post/${post.id}`} className="text-muted hover:underline">
              <time dateTime={post.created_at}>· {timeAgo(post.created_at)}</time>{post.edited_at ? " (edited)" : ""}
            </Link>
          </header>

          {/* Plain text only: React escapes it, so user content can never inject markup. */}
          <p className={`mt-1 whitespace-pre-wrap break-words ${detail ? "text-lg" : "text-[15px]"}`}>{post.body}</p>

          {post.images.map((src) => (
            <Image key={src} src={src} alt="Photo attached to this post" width={900} height={900} sizes="(max-width: 640px) 100vw, 576px"
              className="mt-3 h-auto max-h-[480px] w-full rounded-2xl border border-line object-cover dark:border-white/10" />
          ))}

          <div className="-ml-2 mt-2 flex items-center gap-1 text-sm text-muted">
            <form action={toggleReaction}>
              <input type="hidden" name="postId" value={post.id} />
              <button type="submit" aria-pressed={liked} aria-label={liked ? "Remove like" : "Like"} className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 hover:bg-surface dark:hover:bg-white/10 ${liked ? "text-brand-dark dark:text-brand" : ""}`}>
                <Heart size={20} aria-hidden="true" fill={liked ? "currentColor" : "none"} />
                <span>{post.reaction_count}</span>
              </button>
            </form>
            <Link href={`/post/${post.id}`} aria-label={`${post.comment_count} comments`} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 hover:bg-surface dark:hover:bg-white/10">
              <MessageCircle size={20} aria-hidden="true" />
              <span>{post.comment_count}</span>
            </Link>
            <span className="flex-1" />
            {mine ? (
              <form action={deletePost}>
                <input type="hidden" name="postId" value={post.id} />
                {detail && <input type="hidden" name="redirect" value="home" />}
                <button type="submit" aria-label="Delete post" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><Trash2 size={18} aria-hidden="true" /></button>
              </form>
            ) : (
              <form action={reportContent}>
                <input type="hidden" name="targetType" value="post" />
                <input type="hidden" name="targetId" value={post.id} />
                <input type="hidden" name="reason" value="other" />
                <button type="submit" aria-label="Report post" title="Report post" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><Flag size={18} aria-hidden="true" /></button>
              </form>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
