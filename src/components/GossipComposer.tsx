"use client";

import { useActionState, useEffect, useState } from "react";
import { createGossip, type ActionState } from "@/lib/actions";

export function GossipComposer() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createGossip, undefined);
  const [text, setText] = useState("");
  const [alias, setAlias] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => { if (state?.ok) { setText(""); setSent(true); } }, [state]);

  return (
    <form action={action} className="border-b border-line px-4 py-4 dark:border-white/10" onChange={() => sent && setSent(false)}>
      <label htmlFor="gossip-body" className="sr-only">Your gossip</label>
      <textarea id="gossip-body" name="body" rows={3} maxLength={1000} required value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Spill it anonymously…" className="field min-h-[80px] resize-none py-3" />
      <div className="mt-3">
        <label htmlFor="gossip-alias" className="label">Aka <span className="font-normal text-muted">(optional nickname, not your real name)</span></label>
        <input id="gossip-alias" name="alias" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={24} placeholder="e.g. Nairobi Owl" className="field" autoComplete="off" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{1000 - text.length} left</span>
        <button type="submit" disabled={pending || text.trim().length === 0} className="btn btn-primary">{pending ? "Posting…" : "Post anonymously"}</button>
      </div>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {sent && <p role="status" className="mt-3 rounded-2xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand">Posted anonymously.</p>}
    </form>
  );
}
