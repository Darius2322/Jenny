"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useKeepForm } from "@/lib/useKeepForm";
import { MentionBox } from "./MentionBox";
import { RichText } from "./RichText";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ban, Copy, CornerUpLeft, Flag, Ghost, Pin, PinOff, ShieldCheck, ShieldOff, Trash2, X } from "lucide-react";
import { createGossip2, reactGossip, toggleGossipPin, removeGossip, reportContent, gossipGroupMod, type ActionState } from "@/lib/actions";
import { timeAgo } from "@/lib/posts";
import { GestureItem } from "./GestureItem";
import { ActionSheet, type SheetAction } from "./ActionSheet";

const TOPICS = ["love", "campus", "work", "money", "entertainment", "sports", "politics", "random"];
const EMOJI: Record<string, string> = { fire: "🔥", laugh: "😂", wow: "😮", sad: "😢" };

export type GossipRow = {
  id: string; alias: string | null; body: string; created_at: string; is_mine: boolean;
  reply_to: string | null; reply_alias: string | null; reply_body: string | null; is_pinned: boolean; author_is_admin?: boolean;
  topic?: string | null; reply_count?: number; reactions?: Record<string, number>; my_reactions?: string[];
};

export function GossipFeed({ rows, myAlias, groupId, isAdmin = false, canPost = true }: { rows: GossipRow[]; myAlias: string | null; groupId?: string; isAdmin?: boolean; canPost?: boolean }) {
  const router = useRouter();
  const [state, onSubmit, pending] = useKeepForm<ActionState>(createGossip2);
  const [mine, setMine] = useState<Record<string, { on: string[]; delta: Record<string, number> }>>({});
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
      ...(canPost ? [{ label: "Reply", icon: <CornerUpLeft size={20} aria-hidden="true" />, onClick: () => setReply(g) }] : []),
      { label: "Copy", icon: <Copy size={20} aria-hidden="true" />, onClick: () => { void navigator.clipboard?.writeText(g.body); setToast("Copied"); } },
      { label: pinned ? "Unpin" : "Pin to top (only you see this)", icon: pinned ? <PinOff size={20} aria-hidden="true" /> : <Pin size={20} aria-hidden="true" />,
        onClick: () => {
          setPins((p) => { const n = new Set(p); if (pinned) n.delete(g.id); else n.add(g.id); return n; });
          start(async () => { const ok = await toggleGossipPin(g.id, !pinned); if (!ok) { setToast("Couldn't update pin"); router.refresh(); } });
        } },
    ];
    if (g.is_mine) list.push({ label: "Delete", danger: true, icon: <Trash2 size={20} aria-hidden="true" />,
      onClick: () => { setGone((s) => new Set(s).add(g.id)); start(async () => { const ok = await removeGossip(g.id); if (!ok) { setGone((s) => { const n = new Set(s); n.delete(g.id); return n; }); setToast("Couldn't delete"); } }); } });
    if (groupId && isAdmin) {
      const mod = (action: "remove_post" | "make_admin" | "remove_admin" | "ban_author", done: string, hide = false) => () => {
        if (hide) setGone((x) => new Set(x).add(g.id));
        start(async () => { const ok = await gossipGroupMod(g.id, action); setToast(ok ? done : "Couldn't do that"); if (ok) router.refresh(); else if (hide) setGone((x) => { const n = new Set(x); n.delete(g.id); return n; }); });
      };
      if (!g.is_mine) list.push({ label: "Remove post (admin)", danger: true, icon: <Trash2 size={20} aria-hidden="true" />, onClick: mod("remove_post", "Post removed", true) });
      if (!g.is_mine && !g.author_is_admin) {
        list.push({ label: "Make author an admin", icon: <ShieldCheck size={20} aria-hidden="true" />, onClick: mod("make_admin", "Author is now an admin") });
        list.push({ label: "Remove author from group", danger: true, icon: <Ban size={20} aria-hidden="true" />, onClick: mod("ban_author", "Author removed from the group", true) });
      }
      if (!g.is_mine && g.author_is_admin) list.push({ label: "Remove author's admin role", icon: <ShieldOff size={20} aria-hidden="true" />, onClick: mod("remove_admin", "Admin role removed") });
    }
    if (!g.is_mine) list.push({ label: "Report", danger: true, icon: <Flag size={20} aria-hidden="true" />,
      onClick: () => { const fd = new FormData(); fd.set("targetType", "gossip"); fd.set("targetId", g.id); fd.set("reason", "other"); start(async () => { await reportContent(fd); setToast("Reported. Thank you."); }); } });
    return list;
  }

  return (
    <>
      {canPost ? <form onSubmit={onSubmit} className="border-b border-line px-4 py-4 dark:border-white/10">
        {groupId && <input type="hidden" name="groupId" value={groupId} />}
        {reply && <input type="hidden" name="replyTo" value={reply.id} />}
        {reply && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-4 border-brand bg-surface px-3 py-2 text-sm dark:bg-white/10">
            <span className="min-w-0 flex-1"><strong className="block text-xs text-brand-dark dark:text-brand">Replying to {reply.alias ?? "Anonymous"}</strong><span className="block truncate">{reply.body}</span></span>
            <button type="button" aria-label="Cancel reply" onClick={() => setReply(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={18} aria-hidden="true" /></button>
          </div>
        )}
        <label htmlFor="gossip-body" className="sr-only">Your gossip</label>
        <MentionBox id="gossip-body" name="body" rows={3} maxLength={1000} required value={text} onChange={setText}
          placeholder={reply ? "Write your reply…" : "Spill it anonymously… tag someone with @name"} className="field min-h-[80px] resize-none py-3" />
        {!reply && <select name="topic" aria-label="Topic" defaultValue="" className="field mt-2 !min-h-[44px]"><option value="">No topic</option>{TOPICS.map((t) => <option key={t} value={t}>{t[0]?.toUpperCase()}{t.slice(1)}</option>)}</select>}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="min-w-0 text-xs text-muted">
            Posting as <strong>{myAlias ?? "Anonymous"}</strong>. <Link href="/settings/privacy#gossip" className="font-semibold text-brand-dark underline dark:text-brand">Set your aka</Link>
          </span>
          <button type="submit" disabled={pending || text.trim().length === 0} className="btn btn-primary shrink-0">{pending ? "Posting…" : reply ? "Reply" : "Post"}</button>
        </div>
        {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      </form> : <p className="border-b border-line px-5 py-4 text-sm text-muted dark:border-white/10">Join this group to post and reply.</p>}

      {visible.length === 0 && <p className="px-6 py-14 text-center text-muted">Nothing yet. Be the first to post.</p>}
      {visible.map((g) => (
        <article key={g.id} className="border-b border-line dark:border-white/10">
          <GestureItem onReply={canPost ? () => setReply(g) : undefined} onMenu={() => setSheet(g)} className="px-4 py-4">
            <header className="flex items-center gap-3 text-sm">
              <span className="chip !h-10 !w-10"><Ghost size={18} aria-hidden="true" /></span>
              <span className="font-semibold">{g.alias ?? "Anonymous"}</span>
              {g.author_is_admin && <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand">Admin</span>}
              {g.is_mine && <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted dark:bg-white/10">You</span>}
              {pins.has(g.id) && <Pin size={13} className="text-brand-dark dark:text-brand" aria-label="Pinned" />}
              <time dateTime={g.created_at} className="text-muted">· {timeAgo(g.created_at)}</time>
            </header>
            {g.reply_to && (
              <div className="mt-2 rounded-xl border-l-4 border-brand bg-surface px-3 py-1.5 text-xs dark:bg-white/10">
                {g.reply_body ? <><strong>{g.reply_alias ?? "Anonymous"}</strong><span className="block">{g.reply_body}</span></> : <span className="italic text-muted">Original gossip removed</span>}
              </div>
            )}
            <p className="mt-2 whitespace-pre-wrap break-words text-[15px]"><RichText text={g.body} /></p>
            {g.topic && <span className="mt-2 inline-block rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted dark:bg-white/10">#{g.topic}</span>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              {Object.keys(EMOJI).map((k) => {
                const m = mine[g.id]; const on = (m?.on ?? g.my_reactions ?? []).includes(k);
                const n = Math.max(0, (g.reactions?.[k] ?? 0) + (m?.delta[k] ?? 0));
                return <button key={k} type="button" aria-pressed={on} aria-label={`${k} reaction`} onClick={() => {
                  const base = m?.on ?? g.my_reactions ?? [];
                  setMine((s) => ({ ...s, [g.id]: { on: on ? base.filter((x) => x !== k) : [...base, k], delta: { ...(m?.delta ?? {}), [k]: (m?.delta[k] ?? 0) + (on ? -1 : 1) } } }));
                  start(async () => { const ok = await reactGossip(g.id, k, !on); if (!ok) { setMine((s) => { const rest = { ...s }; delete rest[g.id]; return rest; }); setToast("Couldn't react"); } });
                }} className={`inline-flex min-h-[32px] items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${on ? "bg-brand-tint text-brand-deep dark:bg-brand/20 dark:text-brand" : "bg-surface text-muted dark:bg-white/10"}`}>{EMOJI[k]}{n > 0 ? ` ${n}` : ""}</button>;
              })}
              {(g.reply_count ?? 0) > 0 && <span className="ml-1 text-xs text-muted">{g.reply_count} {g.reply_count === 1 ? "reply" : "replies"}</span>}
            </div>
            <p className="mt-2 text-xs text-muted">Swipe right to reply · press and hold for more</p>
          </GestureItem>
        </article>
      ))}

      {toast && <p role="status" className="pointer-events-none fixed inset-x-0 bottom-28 z-50 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-soft">{toast}</p>}
      {sheet && <ActionSheet title={sheet.body.slice(0, 80)} actions={actions(sheet)} onClose={() => setSheet(null)} />}
    </>
  );
}
