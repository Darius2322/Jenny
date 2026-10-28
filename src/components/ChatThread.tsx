"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Clock, Copy, CornerUpLeft, Pin, PinOff, SendHorizonal, Trash2, X } from "lucide-react";
import { clock, dayKey, dayLabel } from "@/lib/chat-time";
import { sendMessage, deleteMessage, togglePinMessage, togglePinChat, type ActionState } from "@/lib/actions";
import { Avatar } from "./Avatar";
import { GestureItem } from "./GestureItem";
import { ActionSheet, type SheetAction } from "./ActionSheet";

export type ChatMsg = { id: string; sender_id: string; body: string; created_at: string; reply_to_id: string | null };
type Person = { name: string; username: string | null; avatar: string | null };
type Pending = ChatMsg & { pending: true };

type Props = {
  conversationId: string; viewerId: string; messages: ChatMsg[]; pinnedIds: string[]; chatPinned: boolean; person: Person; otherReadAt: string | null;
};

const snippet = (t: string) => (t.length > 90 ? `${t.slice(0, 90)}…` : t);

export function ChatThread({ conversationId, viewerId, messages, pinnedIds, chatPinned, person, otherReadAt }: Props) {
  const router = useRouter();
  const [state, action, sending] = useActionState<ActionState, FormData>(sendMessage, undefined);
  const [pendingMsgs, setPendingMsgs] = useState<Pending[]>([]);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [pins, setPins] = useState<string[]>(pinnedIds);
  const [chatPin, setChatPin] = useState(chatPinned);
  const [reply, setReply] = useState<ChatMsg | null>(null);
  const [sheet, setSheet] = useState<ChatMsg | null>(null);
  const [chatSheet, setChatSheet] = useState(false);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const lastText = useRef("");

  useEffect(() => { setPins(pinnedIds); }, [pinnedIds]);
  useEffect(() => { setPendingMsgs([]); }, [messages]);
  useEffect(() => { if (state?.ok) { start(() => router.refresh()); } }, [state, router]);
  useEffect(() => { if (state?.error) { setPendingMsgs([]); setText(lastText.current); } }, [state]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, pendingMsgs.length]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  const all: ChatMsg[] = useMemo(() => [...messages, ...pendingMsgs].filter((m) => !gone.has(m.id)), [messages, pendingMsgs, gone]);
  const byId = useMemo(() => new Map(all.map((m) => [m.id, m])), [all]);
  const pinnedMsg = pins.map((id) => byId.get(id)).find(Boolean);

  function submit(fd: FormData) {
    const body = text.trim();
    if (!body) return;
    lastText.current = body;
    setPendingMsgs((p) => [...p, { id: `tmp-${Date.now()}`, sender_id: viewerId, body, created_at: new Date().toISOString(), reply_to_id: reply?.id ?? null, pending: true }]);
    setText(""); setReply(null);
    action(fd);
  }

  function msgActions(m: ChatMsg): SheetAction[] {
    const pinned = pins.includes(m.id);
    const list: SheetAction[] = [
      { label: "Reply", icon: <CornerUpLeft size={20} aria-hidden="true" />, onClick: () => setReply(m) },
      { label: "Copy", icon: <Copy size={20} aria-hidden="true" />, onClick: () => { void navigator.clipboard?.writeText(m.body); setToast("Copied"); } },
      { label: pinned ? "Unpin message" : "Pin message", icon: pinned ? <PinOff size={20} aria-hidden="true" /> : <Pin size={20} aria-hidden="true" />,
        onClick: () => {
          setPins((p) => (pinned ? p.filter((x) => x !== m.id) : [m.id, ...p]));
          start(async () => { const ok = await togglePinMessage(conversationId, m.id, !pinned); if (!ok) { setPins(pinnedIds); setToast("Couldn't update pin"); } });
        } },
    ];
    if (m.sender_id === viewerId) list.push({ label: "Delete", danger: true, icon: <Trash2 size={20} aria-hidden="true" />,
      onClick: () => { setGone((g) => new Set(g).add(m.id)); start(async () => { const ok = await deleteMessage(m.id); if (!ok) { setGone((g) => { const n = new Set(g); n.delete(m.id); return n; }); setToast("Couldn't delete"); } }); } });
    return list;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#F3F5F8] dark:bg-night md:left-64">
      <header className="flex items-center gap-2 border-b border-line bg-white px-2 pb-2 dark:border-white/10 dark:bg-slate-900" style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}>
        <Link href="/messages" aria-label="Back to DM" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <Avatar name={person.name} path={person.avatar} size={38} />
        <h1 className="min-w-0 flex-1 truncate font-bold">
          {person.username ? <Link href={`/u/${person.username}`} className="hover:underline">{person.name}</Link> : person.name}
        </h1>
        <button type="button" aria-label="Chat options" onClick={() => setChatSheet(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10">
          {chatPin ? <Pin size={20} className="text-brand-dark dark:text-brand" aria-hidden="true" /> : <Pin size={20} className="text-muted" aria-hidden="true" />}
        </button>
      </header>

      {pinnedMsg && (
        <button type="button" onClick={() => document.getElementById(`m-${pinnedMsg.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })}
          className="flex items-center gap-2 border-b border-line bg-white px-4 py-2 text-left text-sm dark:border-white/10 dark:bg-slate-900">
          <Pin size={16} className="shrink-0 text-brand-dark dark:text-brand" aria-hidden="true" />
          <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-brand-dark dark:text-brand">Pinned message</span><span className="block truncate">{pinnedMsg.body}</span></span>
        </button>
      )}

      <ol className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Messages">
        {all.length === 0 && <li className="py-10 text-center text-muted">Say hello 👋</li>}
        {all.map((m, i) => {
          const mine = m.sender_id === viewerId;
          const prev = all[i - 1];
          const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
          const isPending = m.id.startsWith("tmp-");
          const seen = mine && !isPending && !!otherReadAt && otherReadAt >= m.created_at;
          const quoted = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
          const pinned = pins.includes(m.id);
          return (
            <li key={m.id} id={`m-${m.id}`} className={`flex flex-wrap ${mine ? "justify-end" : "justify-start"}`}>
              {newDay && <div className="my-2 flex w-full justify-center"><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted shadow-sm dark:bg-white/10">{dayLabel(m.created_at)}</span></div>}
              <GestureItem onReply={() => setReply(m)} onMenu={() => !m.id.startsWith("tmp-") && setSheet(m)} className="max-w-[82%]">
                <div className={`rounded-2xl px-3.5 py-2 text-[15px] shadow-sm ${mine ? "rounded-br-md bg-brand text-ink" : "rounded-bl-md bg-white dark:bg-white/10"} ${m.id.startsWith("tmp-") ? "opacity-70" : ""}`}>
                  {m.reply_to_id && (
                    <div className={`mb-1.5 rounded-lg border-l-4 px-2 py-1 text-xs ${mine ? "border-brand-deep bg-black/10" : "border-brand bg-surface dark:bg-white/10"}`}>
                      {quoted ? <><strong>{quoted.sender_id === viewerId ? "You" : person.name}</strong><span className="block">{snippet(quoted.body)}</span></> : <span className="italic opacity-70">Original message</span>}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <span className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${mine ? "text-ink/70" : "text-muted"}`}>
                    {pinned && <Pin size={11} aria-label="Pinned" />}<time dateTime={m.created_at}>{clock(m.created_at)}</time>
                    {mine && (isPending ? <Clock size={13} aria-label="Sending" /> : seen ? <CheckCheck size={16} className="text-sky-600" aria-label="Seen" /> : <Check size={15} aria-label="Sent" />)}
                  </span>
                </div>
              </GestureItem>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      {toast && <p role="status" className="pointer-events-none absolute inset-x-0 bottom-28 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-soft">{toast}</p>}

      <form action={submit} className="border-t border-line bg-white px-3 pt-2 dark:border-white/10 dark:bg-slate-900" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <input type="hidden" name="conversationId" value={conversationId} />
        {reply && <input type="hidden" name="replyToId" value={reply.id} />}
        {reply && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-4 border-brand bg-surface px-3 py-2 text-sm dark:bg-white/10">
            <span className="min-w-0 flex-1"><strong className="block text-xs text-brand-dark dark:text-brand">Replying to {reply.sender_id === viewerId ? "yourself" : person.name}</strong><span className="block truncate">{reply.body}</span></span>
            <button type="button" aria-label="Cancel reply" onClick={() => setReply(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={18} aria-hidden="true" /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="message-body" className="sr-only">Message</label>
          <textarea id="message-body" name="body" rows={1} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
            placeholder="Write a message" className="field max-h-32 min-h-[48px] resize-none py-3" />
          <button type="submit" disabled={sending || text.trim().length === 0} aria-label="Send message" className="btn btn-primary !min-h-[48px] !min-w-[48px] !px-3"><SendHorizonal size={20} aria-hidden="true" /></button>
        </div>
        {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      </form>

      {sheet && <ActionSheet title={snippet(sheet.body)} actions={msgActions(sheet)} onClose={() => setSheet(null)} />}
      {chatSheet && (
        <ActionSheet title={person.name} onClose={() => setChatSheet(false)} actions={[
          { label: chatPin ? "Unpin chat" : "Pin chat to top", icon: chatPin ? <PinOff size={20} aria-hidden="true" /> : <Pin size={20} aria-hidden="true" />,
            onClick: () => { const next = !chatPin; setChatPin(next); start(async () => { const ok = await togglePinChat(conversationId, next); if (!ok) setChatPin(!next); }); } },
        ]} />
      )}
    </div>
  );
}
