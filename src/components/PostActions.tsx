"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { likePost, repostPost } from "@/lib/actions";

type Props = { postId: string; liked: boolean; likes: number; reposted: boolean; reposts: number; comments: number };

/** Like / repost update instantly on tap and sync in the background; they roll back if the server refuses. */
export function PostActions(p: Props) {
  const [liked, setLiked] = useState(p.liked);
  const [likes, setLikes] = useState(p.likes);
  const [reposted, setReposted] = useState(p.reposted);
  const [reposts, setReposts] = useState(p.reposts);
  const [, start] = useTransition();

  function toggle(kind: "like" | "repost") {
    if (kind === "like") {
      const next = !liked; setLiked(next); setLikes((n) => n + (next ? 1 : -1));
      start(async () => { const ok = await likePost(p.postId, next); if (!ok) { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); } });
    } else {
      const next = !reposted; setReposted(next); setReposts((n) => n + (next ? 1 : -1));
      start(async () => { const ok = await repostPost(p.postId, next); if (!ok) { setReposted(!next); setReposts((n) => n + (next ? -1 : 1)); } });
    }
  }
  const btn = "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 transition active:scale-90 hover:bg-surface dark:hover:bg-white/10";
  return (
    <>
      <button type="button" onClick={() => toggle("like")} aria-pressed={liked} aria-label={liked ? "Remove like" : "Like"} className={`${btn} ${liked ? "text-brand-dark dark:text-brand" : ""}`}>
        <Heart size={20} aria-hidden="true" fill={liked ? "currentColor" : "none"} /><span>{likes}</span>
      </button>
      <Link href={`/post/${p.postId}`} aria-label={`${p.comments} comments`} className={btn}>
        <MessageCircle size={20} aria-hidden="true" /><span>{p.comments}</span>
      </Link>
      <button type="button" onClick={() => toggle("repost")} aria-pressed={reposted} aria-label={reposted ? "Undo repost" : "Repost"} className={`${btn} ${reposted ? "text-brand-dark dark:text-brand" : ""}`}>
        <Repeat2 size={20} aria-hidden="true" /><span>{reposts}</span>
      </button>
    </>
  );
}
