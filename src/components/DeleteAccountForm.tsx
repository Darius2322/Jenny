"use client";

import { useActionState } from "react";
import { requestAccountDeletion, cancelAccountDeletion, type ActionState } from "@/lib/actions";

export function DeleteAccountForm({ requestedAt }: { requestedAt: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestAccountDeletion, undefined);
  if (requestedAt) {
    return (
      <section aria-labelledby="delete-heading" className="border-t border-line px-4 py-5 dark:border-white/10">
        <h2 id="delete-heading" className="font-semibold">Account deletion requested</h2>
        <p role="status" className="mt-1 text-sm text-muted">
          You asked to delete your account on {new Date(requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          Our team will process it and your profile, posts and messages will be removed. You can cancel until it has been processed.
        </p>
        <form action={cancelAccountDeletion} className="mt-3"><button type="submit" className="btn btn-secondary">Cancel deletion request</button></form>
      </section>
    );
  }
  return (
    <section aria-labelledby="delete-heading" className="border-t border-line px-4 py-5 dark:border-white/10">
      <h2 id="delete-heading" className="font-semibold">Delete my account</h2>
      <p className="mt-1 text-sm text-muted">This asks our team to permanently remove your account and content. It is not instant, and you can cancel until it has been processed.</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-red-600 dark:text-red-400">Request deletion</summary>
        <form action={action} className="mt-3 space-y-3">
          <div>
            <label htmlFor="reason" className="label">Reason (optional)</label>
            <textarea id="reason" name="reason" rows={2} maxLength={500} className="field py-3" />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Type DELETE to confirm</label>
            <input id="confirm" name="confirm" autoComplete="off" autoCapitalize="characters" required className="field" />
          </div>
          {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
          {state?.ok && <p role="status" className="text-sm font-medium text-brand-dark dark:text-brand">Request received.</p>}
          <button type="submit" disabled={pending} className="btn btn-secondary">{pending ? "Sending…" : "Request account deletion"}</button>
        </form>
      </details>
    </section>
  );
}
