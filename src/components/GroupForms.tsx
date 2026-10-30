"use client";

import { useKeepForm } from "@/lib/useKeepForm";
import { createGossipGroup, joinGossipGroupByCode, type ActionState } from "@/lib/actions";
import { Toggle } from "./Toggle";

export function CreateGroupForm() {
  const [state, onSubmit, pending] = useKeepForm<ActionState>(createGossipGroup);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label htmlFor="gname" className="label">Group name</label><input id="gname" name="name" required minLength={3} maxLength={40} className="field" placeholder="e.g. Campus Tea" autoComplete="off" /></div>
      <div><label htmlFor="gdesc" className="label">What is it about? <span className="font-normal text-muted">(optional)</span></label><textarea id="gdesc" name="description" rows={2} maxLength={200} className="field py-3" /></div>
      <div className="overflow-hidden rounded-3xl border border-line dark:border-white/10"><Toggle name="private" label="Private group" hint="Only people with your invite code can find and join" /></div>
      <p className="text-xs text-muted">You become the group admin. Everyone, including admins, stays anonymous to each other. Admins can remove posts and members without ever seeing who wrote them.</p>
      {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Creating…" : "Create group"}</button>
    </form>
  );
}

export function JoinCodeForm() {
  const [state, onSubmit, pending] = useKeepForm<ActionState>(joinGossipGroupByCode);
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="code" className="label">Have an invite code?</label>
      <div className="flex gap-2"><input id="code" name="code" required maxLength={20} autoCapitalize="none" autoComplete="off" className="field" placeholder="Paste code" /><button type="submit" disabled={pending} className="btn btn-primary">{pending ? "…" : "Join"}</button></div>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
