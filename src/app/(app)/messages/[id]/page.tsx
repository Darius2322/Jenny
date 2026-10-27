import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { ChatThread, type ChatMsg } from "@/components/ChatThread";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;

  // RLS: non-participants get no rows, so this is a 404 for them.
  const [{ data: members }, { data: rows }, { data: pins }] = await Promise.all([
    supabase.from("conversation_members").select("user_id, pinned_at").eq("conversation_id", id),
    supabase.from("messages").select("id, sender_id, body, created_at, reply_to_id").eq("conversation_id", id).order("created_at", { ascending: false }).limit(60),
    supabase.from("message_pins").select("message_id").eq("conversation_id", id).order("created_at", { ascending: false }),
  ]);
  const mine = (members ?? []).find((m: { user_id: string }) => m.user_id === user.id) as { pinned_at: string | null } | undefined;
  if (!mine) notFound();
  const otherId = (members ?? []).find((m: { user_id: string }) => m.user_id !== user.id)?.user_id as string | undefined;

  const [{ data: person }] = await Promise.all([
    otherId ? supabase.from("profiles").select("username, display_name, avatar_path").eq("id", otherId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", id).eq("user_id", user.id),
  ]);

  const messages = ((rows ?? []) as ChatMsg[]).reverse();
  return (
    <>
      <AutoRefresh seconds={5} />
      <ChatThread
        conversationId={id} viewerId={user.id} messages={messages}
        pinnedIds={(pins ?? []).map((p: { message_id: string }) => p.message_id)} chatPinned={!!mine.pinned_at}
        person={{ name: person?.display_name ?? "Unavailable user", username: person?.username ?? null, avatar: person?.avatar_path ?? null }}
      />
    </>
  );
}
