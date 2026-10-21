import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Author } from "@/lib/posts";
import { Avatar } from "@/components/Avatar";
import { MessageForm } from "@/components/MessageForm";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS: non-participants get no rows, so this is a 404 for them.
  const { data: membership } = await supabase.from("conversation_members").select("conversation_id").eq("conversation_id", id).eq("user_id", user.id).maybeSingle();
  if (!membership) notFound();

  const [{ data: other }, { data: rows }] = await Promise.all([
    supabase.from("conversation_members").select("user_id").eq("conversation_id", id).neq("user_id", user.id).maybeSingle(),
    supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  const messages = ((rows ?? []) as Msg[]).reverse();

  let person: Author | null = null;
  if (other?.user_id) {
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_path").eq("id", other.user_id).maybeSingle();
    person = (data as Author | null) ?? null;
  }

  // Mark as read (the viewer's own membership row only; RLS enforces this).
  await supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", id).eq("user_id", user.id);

  return (
    <>
      <AutoRefresh seconds={6} />
      <div className="sticky top-14 z-20 flex items-center gap-2 border-b border-line bg-white px-2 py-2 dark:border-white/10 dark:bg-night md:top-0">
        <Link href="/messages" aria-label="Back to messages" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <Avatar name={person?.display_name ?? "?"} path={person?.avatar_path} size={36} />
        <h1 className="min-w-0 truncate font-bold">
          {person ? <Link href={`/u/${person.username}`} className="hover:underline">{person.display_name}</Link> : "Unavailable user"}
        </h1>
      </div>

      <ol className="flex min-h-[40vh] flex-col gap-2 px-4 py-4" aria-label="Messages">
        {messages.length === 0 && <li className="py-10 text-center text-muted">Say hello 👋</li>}
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] ${mine ? "rounded-br-md bg-brand text-ink" : "rounded-bl-md bg-surface dark:bg-white/10"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <time dateTime={m.created_at} className={`mt-0.5 block text-[11px] ${mine ? "text-ink/70" : "text-muted"}`}>
                  {new Date(m.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                </time>
              </div>
            </li>
          );
        })}
      </ol>

      <MessageForm conversationId={id} />
    </>
  );
}
