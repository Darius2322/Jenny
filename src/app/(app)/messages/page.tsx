import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Pin } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { timeAgo, type Author } from "@/lib/posts";
import { Avatar } from "@/components/Avatar";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "DM", robots: { index: false } };

type Msg = { conversation_id: string; sender_id: string; body: string; created_at: string };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: err } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;

  const { data: mine } = await supabase.from("conversation_members").select("conversation_id, last_read_at, pinned_at").eq("user_id", user.id);
  const myRows = (mine ?? []) as { conversation_id: string; last_read_at: string; pinned_at: string | null }[];
  const pinnedAt = new Map(myRows.map((m) => [m.conversation_id, m.pinned_at]));
  const convIds = myRows.map((m) => m.conversation_id);
  const lastRead = new Map(myRows.map((m) => [m.conversation_id, m.last_read_at]));

  const others = new Map<string, string>(); // conversation -> other user id
  const lastMsg = new Map<string, Msg>();
  const people = new Map<string, Author>();

  if (convIds.length) {
    const [{ data: members }, { data: msgs }] = await Promise.all([
      supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", convIds).neq("user_id", user.id),
      supabase.from("messages").select("conversation_id, sender_id, body, created_at").in("conversation_id", convIds).order("created_at", { ascending: false }).limit(200),
    ]);
    (members ?? []).forEach((m: { conversation_id: string; user_id: string }) => others.set(m.conversation_id, m.user_id));
    (msgs ?? []).forEach((m: Msg) => { if (!lastMsg.has(m.conversation_id)) lastMsg.set(m.conversation_id, m); });
    const ids = [...new Set(others.values())];
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_path").in("id", ids);
      (data ?? []).forEach((p: Author) => people.set(p.id, p));
    }
  }

  const list = convIds
    .filter((id) => lastMsg.has(id))
    .sort((a, b) => (pinnedAt.get(a) ? 0 : 1) - (pinnedAt.get(b) ? 0 : 1) || (lastMsg.get(b)!.created_at).localeCompare(lastMsg.get(a)!.created_at));

  return (
    <>
      <AutoRefresh seconds={15} />
      <h1 className="px-5 pt-6 text-2xl font-extrabold">DM</h1>
      {err && <p role="alert" className="mx-4 mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">You can&apos;t start a conversation with that person.</p>}

      {list.length === 0 && (
        <div className="px-6 py-14 text-center">
          <MessageCircle size={36} className="mx-auto text-muted" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold">No conversations yet</p>
          <p className="mt-2 text-muted">Open someone&apos;s profile and choose Message to start a private conversation.</p>
          <Link href="/discover" className="btn btn-primary mt-5">Find people</Link>
        </div>
      )}

      <ul className="mt-3">
        {list.map((id) => {
          const m = lastMsg.get(id)!;
          const p = people.get(others.get(id) ?? "");
          const unread = m.sender_id !== user.id && m.created_at > (lastRead.get(id) ?? "");
          return (
            <li key={id} className="border-b border-line dark:border-white/10">
              <Link href={`/messages/${id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface dark:hover:bg-white/5">
                <Avatar name={p?.display_name ?? "?"} path={p?.avatar_path} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate ${unread ? "font-bold" : "font-semibold"}`}>{p?.display_name ?? "Unavailable user"}</span>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(m.created_at)}</span>
                  </span>
                  <span className={`block truncate text-sm ${unread ? "font-medium" : "text-muted"}`}>{m.sender_id === user.id ? "You: " : ""}{m.body}</span>
                </span>
                {pinnedAt.get(id) && <Pin size={14} className="shrink-0 text-muted" aria-label="Pinned" />}
                {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
