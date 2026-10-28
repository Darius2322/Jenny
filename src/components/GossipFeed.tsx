"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, CornerUpLeft, Flag, Ghost, Pin, PinOff, Trash2, X } from "lucide-react";
import { createGossip, toggleGossipPin, removeGossip, reportContent, type ActionState } from "@/lib/actions";
import { timeAgo } from "@/lib/posts";
import { GestureItem } from "./GestureItem";
import { ActionSheet, type SheetAction } from "./ActionSheet";

export type GossipRow = {
  id: string; alias: string | null; body: string; created_at: string; is_mine: boolean;
  reply_to: string | null; reply_alias: string | null; reply_body: string | null; is_pinned: boolean;
};

export function GossipFeed({ rows, myAlias }: { rows: GossipRow[]; myAlias: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(createGossip, undefined);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<GossipRow | null>(null);
  const [sheet, setSheet] = useState<GossipRow | null>(null);
  const [pins, setPins] = useState<Set<string>>(new Set(rows.filter((r) => r.is_pinned).map((r) => r.id)));
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => { setPins(new Set(rows.filter((r) => r.is_pinned).map((r) => r.id))); }, [rows]);
  useEffect(() => { if (state?.ok) { setText(""); setReply(null); setToast("Posted anonymously"); start(() => router.refresh()); } }, [state, router]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  const visible = useMemo(() => {
    const list = rows.filter((r) => !gone.has(r.id));
    return [...list.filter((r) => pins.has(r.id)), ...list.filter((r) => !pins.has(r.id))];
  }, [rows, gone, pins]);

  function actions(g: GossipRow): SheetAction[] {
    const pinned = pins.has(g.id);
    const list: SheetAction[] = [
      { label: "Reply", icon: <CornerUpLeft size={20} aria-hidden="true" />, onClick: () => setReply(g) },
      { label: "Copy", icon: <Copy size={20} aria-hidden="true" />, onClick: () => { void navigator.clipboard?.writeText(g.body); setToast("Copied"); } },
      { label: pinned ? "Unpin" : "Pin to top (only you see this)", icon: pinned ? <PinOff size={20} aria-hidden="true" /> : <Pin size={20} aria-hidden="true" />,
        onClick: () => {
          setPins((p) => { const n = new Set(p); if (pinned) n.delete(g.id); else n.add(g.id); return n; });
          start(async () => { const ok = await toggleGossipPin(g.id, !pinned); if (!ok) { setToast("Couldn't update pin"); router.refresh(); } });
        } },
    ];
    if (g.is_mine) list.push({ label: "Delete", danger: true, icon: <Trash2 size={20} aria-hidden="true" />,
      onClick: () => { setGone((s) => new Set(s).add(g.id)); start(async () => { const ok = await removeGossip(g.id); if (!ok) { setGone((s) => { const n = new Set(s); n.delete(g.id); return n; }); setToast("Couldn't delete"); } }); } });
    else list.push({ label: "Report", danger: true, icon: <Flag size={20} aria-hidden="true" />,
      onClick: () => { const fd = new FormData(); fd.set("targetType", "gossip"); fd.set("targetId", g.id); fd.set("reason", "other"); start(async () => { await reportContent(fd); setToast("Reported. Thank you."); }); } });
    return list;
  }

  return (
    <>
      <form action={action} className="border-b border-line px-4 py-4 dark:border-white/10">
        {reply && <input type="hidden" name="replyTo" value={reply.id} />}
        {reply && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-4 border-brand bg-surface px-3 py-2 text-sm dark:bg-white/10">
            <span className="min-w-0 flex-1"><strong className="block text-xs text-brand-dark dark:text-brand">Replying to {reply.alias ?? "Anonymous"}</strong><span className="block truncate">{reply.body}</span></span>
            <button type="button" aria-label="Cancel reply" onClick={() => setReply(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={18} aria-hidden="true" /></button>
          </div>
        )}
        <label htmlFor="gossip-body" className="sr-only">Your gossip</label>
        <textarea id="gossip-body" name="body" rows={3} maxLength={1000} required value={text} onChange={(e) => setText(e.target.value)}
          placeholder={reply ? "Write your reply…" : "Spill it anonymously…"} className="field min-h-[80px] resize-none py-3" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="min-w-0 text-xs text-muted">
            Posting as <strong>{myAlias ?? "Anonymous"}</strong>. <Link href="/settings/privacy#gossip" className="font-semibold text-brand-dark underline dark:text-brand">Set your aka</Link>
          </span>
          <button type="submit" disabled={pending || text.trim().length === 0} className="btn btn-primary shrink-0">{pending ? "Posting…" : reply ? "Reply" : "Post"}</button>
        </div>
        {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      </form>

      {visible.length === 0 && <p className="px-6 py-14 text-center text-muted">Nothing yet. Be the first to post.</p>}
      {visible.map((g) => (
        <article key={g.id} className="border-b border-line dark:border-white/10">
          <GestureItem onReply={() => setReply(g)} onMenu={() => setSheet(g)} className="px-4 py-4">
            <header className="flex items-center gap-3 text-sm">
              <span className="chip !h-10 !w-10"><Ghost size={18} aria-hidden="true" /></span>
              <span className="font-semibold">{g.alias ?? "Anonymous"}</span>
              {g.is_mine && <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted dark:bg-white/10">You</span>}
              {pins.has(g.id) && <Pin size={13} className="text-brand-dark dark:text-brand" aria-label="Pinned" />}
              <time dateTime={g.created_at} className="text-muted">· {timeAgo(g.created_at)}</time>
            </header>
            {g.reply_to && (
              <div className="mt-2 rounded-xl border-l-4 border-brand bg-surface px-3 py-1.5 text-xs dark:bg-white/10">
                {g.reply_body ? <><strong>{g.reply_alias ?? "Anonymous"}</strong><span className="block">{g.reply_body}</span></> : <span className="italic text-muted">Original gossip removed</span>}
              </div>
            )}
            <p className="mt-2 whitespace-pre-wrap break-words text-[15px]">{g.body}</p>
            <p className="mt-2 text-xs text-muted">Swipe right to reply · press and hold for more</p>
          </GestureItem>
        </article>
      ))}

      {toast && <p role="status" className="pointer-events-none fixed inset-x-0 bottom-28 z-50 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-soft">{toast}</p>}
      {sheet && <ActionSheet title={sheet.body.slice(0, 80)} actions={actions(sheet)} onClose={() => setSheet(null)} />}
    </>
  );
}
