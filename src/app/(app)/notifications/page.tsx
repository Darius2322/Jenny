import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, acceptFollowRequest } from "@/lib/actions";
import { timeAgo, type Author } from "@/lib/posts";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

type N = { id: string; actor_id: string | null; type: string; post_id: string | null; read_at: string | null; created_at: string };

const verb: Record<string, string> = {
  follow: "started following you", follow_request: "wants to follow you", reaction: "liked your post",
  comment: "commented on your post", reply: "replied to your comment", message: "sent you a message",
  business_enquiry: "sent an enquiry to your business", moderation: "A moderation decision was made", security: "Security notice",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("notifications").select("id, actor_id, type, post_id, read_at, created_at")
    .order("created_at", { ascending: false }).limit(50);
  const items = (rows ?? []) as N[];

  const ids = [...new Set(items.map((n) => n.actor_id).filter((x): x is string => !!x))];
  const actors = new Map<string, Author>();
  if (ids.length) {
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_path").in("id", ids);
    (data ?? []).forEach((a: Author) => actors.set(a.id, a));
  }
  const hasUnread = items.some((n) => !n.read_at);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5">
        <h1 className="text-xl font-bold">Notifications</h1>
        {hasUnread && <form action={markAllNotificationsRead}><button type="submit" className="btn btn-secondary !min-h-[40px]">Mark all as read</button></form>}
      </div>
      {error && <p role="alert" className="p-4 text-sm text-red-600">Couldn&apos;t load notifications.</p>}
      {!error && items.length === 0 && <p className="px-4 py-12 text-center text-muted">No notifications yet. When people follow you or react to your posts, you&apos;ll see it here.</p>}
      <ul className="mt-3">
        {items.map((n) => {
          const a = n.actor_id ? actors.get(n.actor_id) : undefined;
          const href = n.type === "business_enquiry" ? "/business" : n.type === "message" ? "/messages" : n.post_id ? `/post/${n.post_id}` : a ? `/u/${a.username}` : "/notifications";
          return (
            <li key={n.id} className={`flex items-center gap-3 border-b border-line px-4 py-3 dark:border-white/10 ${n.read_at ? "" : "bg-brand/5"}`}>
              <Avatar name={a?.display_name ?? "J"} path={a?.avatar_path} size={40} />
              <Link href={href} className="min-w-0 flex-1 text-sm">
                {a && <strong>{a.display_name} </strong>}{verb[n.type] ?? "New activity"}
                <span className="block text-xs text-muted">{timeAgo(n.created_at)}{n.read_at ? "" : " · New"}</span>
              </Link>
              {n.type === "follow_request" && n.actor_id && (
                <form action={acceptFollowRequest}>
                  <input type="hidden" name="followerId" value={n.actor_id} />
                  <button type="submit" className="btn btn-primary !min-h-[40px]">Accept</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
