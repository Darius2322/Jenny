"use client";

import { useActionState } from "react";
import { saveGossipAlias, type ActionState } from "@/lib/actions";

export function GossipAliasForm({ alias }: { alias: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveGossipAlias, undefined);
  return (
    <section id="gossip" aria-labelledby="gossip-heading" className="border-b border-line px-4 py-5 dark:border-white/10">
      <h2 id="gossip-heading" className="font-semibold">Gossip aka</h2>
      <p className="mt-1 text-sm text-muted">Optional. This nickname appears on your anonymous gossip instead of your name. Leave it empty to post as &quot;Anonymous&quot;. It is never shown on your profile.</p>
      <form action={action} className="mt-3 flex gap-2">
        <label htmlFor="alias" className="sr-only">Gossip aka</label>
        <input id="alias" name="alias" defaultValue={alias ?? ""} maxLength={24} placeholder="e.g. Nairobi Owl" autoComplete="off" className="field" />
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save"}</button>
      </form>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-brand-dark dark:text-brand">Saved.</p>}
    </section>
  );
}
