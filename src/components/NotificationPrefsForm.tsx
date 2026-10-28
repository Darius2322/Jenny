"use client";

import { useActionState } from "react";
import { saveNotificationPrefs, type ActionState } from "@/lib/actions";
import { Toggle } from "./Toggle";

type Prefs = Record<"notify_follows" | "notify_reactions" | "notify_comments" | "notify_messages" | "notify_business_enquiries" | "notify_marketing", boolean>;

export function NotificationPrefsForm({ prefs }: { prefs: Prefs }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveNotificationPrefs, undefined);
  return (
    <form action={action}>
      <div className="mt-4 border-y border-line dark:border-white/10">
        <Toggle name="notify_follows" label="New followers and requests" defaultChecked={prefs.notify_follows} />
        <Toggle name="notify_reactions" label="Likes on your posts" defaultChecked={prefs.notify_reactions} />
        <Toggle name="notify_comments" label="Comments and replies" defaultChecked={prefs.notify_comments} />
        <Toggle name="notify_messages" label="New DMs" defaultChecked={prefs.notify_messages} />
        <Toggle name="notify_business_enquiries" label="Business enquiries" hint="Only if you run a business on Jenny" defaultChecked={prefs.notify_business_enquiries} />
        <Toggle name="notify_marketing" label="News and tips from Jenny" defaultChecked={prefs.notify_marketing} />
      </div>
      <div className="px-5 py-4">
        {state?.error && <p role="alert" className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.ok && <p role="status" className="mb-2 text-sm font-semibold text-brand-dark dark:text-brand">Saved.</p>}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Saving…" : "Save"}</button>
        <p className="mt-3 text-xs text-muted">Security notices and moderation decisions are always sent.</p>
      </div>
    </form>
  );
}
