"use client";

import { useState, useTransition } from "react";
import { Heart, X, Flag, Ban, MapPin, PartyPopper, Star, Undo2, BadgeCheck } from "lucide-react";
import { swipeDating2, rewindDating, reportContent, toggleBlock, startConversation } from "@/lib/actions";
import { Avatar } from "./Avatar";

export type Candidate = { user_id: string; username: string; display_name: string; avatar_path: string | null; age: number; gender: string; bio: string | null; region: string | null; interests: string[] | null; prompt?: string | null; answer?: string | null; verified?: boolean; hobbies?: string[]; super_liked_you?: boolean; shared?: number };

export function DatingDeck({ initial }: { initial: Candidate[] }) {
  const [queue, setQueue] = useState(initial);
  const [match, setMatch] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const current = queue[0];

  function decide(like: boolean, superLike = false) {
    if (!current) return;
    const c = current;
    setQueue((q) => q.slice(1)); setError(null);
    start(async () => {
      const r = await swipeDating2(c.user_id, like, superLike);
      if (!r.ok) { setQueue((q) => [c, ...q]); setError(r.error ?? "Couldn't save that. Please try again."); return; }
      if (r.matched) setMatch(c);
    });
  }
  function undo() {
    setError(null);
    start(async () => { const ok = await rewindDating(); if (ok) window.location.reload(); else setError("Nothing to undo. You can only take back a pass from the last 10 minutes."); });
  }
  function act(kind: "report" | "block") {
    if (!current) return;
    const c = current; const fd = new FormData();
    setQueue((q) => q.slice(1));
    if (kind === "report") { fd.set("targetType", "profile"); fd.set("targetId", c.user_id); fd.set("reason", "other"); start(async () => { await reportContent(fd); }); }
    else { fd.set("targetId", c.user_id); start(async () => { await toggleBlock(fd); }); }
  }

  if (match) {
    return (
      <div className="px-6 py-12 text-center">
        <span className="chip mx-auto !h-16 !w-16"><PartyPopper size={30} aria-hidden="true" /></span>
        <h2 className="mt-4 text-2xl font-extrabold">It&apos;s a match!</h2>
        <p className="mt-2 text-muted">You and {match.display_name} like each other.</p>
        <div className="mt-6 flex flex-col gap-3">
          <form action={startConversation}><input type="hidden" name="targetId" value={match.user_id} /><button type="submit" className="btn btn-primary w-full">Say hello in DM</button></form>
          <button type="button" onClick={() => setMatch(null)} className="btn btn-secondary">Keep browsing</button>
        </div>
      </div>
    );
  }
  if (!current) {
    return <p className="px-6 py-16 text-center text-muted">You&apos;ve seen everyone for now. Check back later, or adjust who you&apos;d like to meet in My profile.</p>;
  }
  return (
    <div className="px-5 py-5">
      <article className="card overflow-hidden">
        <div className="flex flex-col items-center gap-3 bg-brand-tint px-6 py-8 dark:bg-brand/10">
          <Avatar name={current.display_name} path={current.avatar_path} size={160} />
          {current.super_liked_you && <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"><Star size={12} className="mr-1 inline" fill="currentColor" aria-hidden="true" />Super Liked you</p>}
          <h2 className="flex items-center gap-1 text-2xl font-extrabold">{current.display_name}, {current.age}{current.verified && <BadgeCheck size={20} className="text-brand-dark" aria-label="Verified" />}</h2>
          {current.region && <p className="flex items-center gap-1 text-sm text-muted"><MapPin size={14} aria-hidden="true" />{current.region}</p>}
        </div>
        <div className="space-y-3 px-5 py-4">
          {current.bio && <p className="whitespace-pre-wrap break-words">{current.bio}</p>}
          {current.prompt && current.answer && <div className="rounded-2xl bg-surface p-3 dark:bg-white/10"><p className="text-xs font-semibold text-muted">{current.prompt}</p><p className="mt-1">{current.answer}</p></div>}
          {(current.shared ?? 0) > 0 && <p className="text-xs font-semibold text-brand-dark dark:text-brand">{current.shared} shared hobb{current.shared === 1 ? "y" : "ies"}</p>}
          {(current.hobbies ?? []).length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Hobbies">{(current.hobbies ?? []).map((i) => <li key={i} className="rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand-deep dark:bg-brand/15 dark:text-brand">{i}</li>)}</ul>}
          {(current.interests ?? []).length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Interests">{(current.interests ?? []).map((i) => <li key={i} className="rounded-full bg-surface px-3 py-1 text-xs font-medium dark:bg-white/10">{i}</li>)}</ul>
          )}
        </div>
      </article>
      <div className="mt-5 flex items-center justify-center gap-5">
        <button type="button" onClick={() => decide(false)} aria-label="Pass" className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white shadow-soft active:scale-90 dark:border-white/15 dark:bg-white/5"><X size={28} aria-hidden="true" /></button>
        <button type="button" onClick={() => decide(true, true)} aria-label="Super Like (3 a day)" className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-600 shadow-soft active:scale-90"><Star size={24} fill="currentColor" aria-hidden="true" /></button>
        <button type="button" onClick={() => decide(true)} aria-label="Like" className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-dark text-white shadow-glow active:scale-90"><Heart size={32} fill="currentColor" aria-hidden="true" /></button>
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs text-muted">
        <button type="button" onClick={undo} className="inline-flex min-h-[44px] items-center gap-1 underline"><Undo2 size={14} aria-hidden="true" /> Undo pass</button>
        <button type="button" onClick={() => act("report")} className="inline-flex min-h-[44px] items-center gap-1 underline"><Flag size={14} aria-hidden="true" /> Report</button>
        <button type="button" onClick={() => act("block")} className="inline-flex min-h-[44px] items-center gap-1 underline"><Ban size={14} aria-hidden="true" /> Block</button>
      </div>
      {error && <p role="alert" className="mt-2 text-center text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
