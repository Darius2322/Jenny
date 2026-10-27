"use client";

import { useState, useTransition } from "react";
import { Heart, X, Flag, Ban, MapPin, PartyPopper } from "lucide-react";
import { swipeDating, reportContent, toggleBlock, startConversation } from "@/lib/actions";
import { Avatar } from "./Avatar";

export type Candidate = { user_id: string; username: string; display_name: string; avatar_path: string | null; age: number; gender: string; bio: string | null; region: string | null; interests: string[] | null };

export function DatingDeck({ initial }: { initial: Candidate[] }) {
  const [queue, setQueue] = useState(initial);
  const [match, setMatch] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const current = queue[0];

  function decide(like: boolean) {
    if (!current) return;
    const c = current;
    setQueue((q) => q.slice(1)); setError(null);
    start(async () => {
      const r = await swipeDating(c.user_id, like);
      if (!r.ok) { setQueue((q) => [c, ...q]); setError("Couldn't save that. Please try again."); return; }
      if (r.matched) setMatch(c);
    });
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
          <h2 className="text-2xl font-extrabold">{current.display_name}, {current.age}</h2>
          {current.region && <p className="flex items-center gap-1 text-sm text-muted"><MapPin size={14} aria-hidden="true" />{current.region}</p>}
        </div>
        <div className="space-y-3 px-5 py-4">
          {current.bio && <p className="whitespace-pre-wrap break-words">{current.bio}</p>}
          {(current.interests ?? []).length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Interests">{(current.interests ?? []).map((i) => <li key={i} className="rounded-full bg-surface px-3 py-1 text-xs font-medium dark:bg-white/10">{i}</li>)}</ul>
          )}
        </div>
      </article>
      <div className="mt-5 flex items-center justify-center gap-5">
        <button type="button" onClick={() => decide(false)} aria-label="Pass" className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white shadow-soft active:scale-90 dark:border-white/15 dark:bg-white/5"><X size={28} aria-hidden="true" /></button>
        <button type="button" onClick={() => decide(true)} aria-label="Like" className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-dark text-white shadow-glow active:scale-90"><Heart size={32} fill="currentColor" aria-hidden="true" /></button>
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs text-muted">
        <button type="button" onClick={() => act("report")} className="inline-flex min-h-[44px] items-center gap-1 underline"><Flag size={14} aria-hidden="true" /> Report</button>
        <button type="button" onClick={() => act("block")} className="inline-flex min-h-[44px] items-center gap-1 underline"><Ban size={14} aria-hidden="true" /> Block</button>
      </div>
      {error && <p role="alert" className="mt-2 text-center text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
