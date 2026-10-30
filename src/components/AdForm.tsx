"use client";

import { useKeepForm } from "@/lib/useKeepForm";
import { applyForAd, type AdState } from "@/lib/ads-actions";
import { ImagePicker } from "./ImagePicker";

export function AdForm() {
  const [state, onSubmit, pending] = useKeepForm<NonNullable<AdState>>(applyForAd as never);
  return (
    <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
      {state?.ok ? <p role="status" className="rounded-2xl border border-brand bg-brand-tint p-4 text-sm font-semibold text-brand-deep dark:bg-brand/10 dark:text-brand">Application sent. Our team reviews every ad. You&apos;ll get a notification when it&apos;s decided.</p> : null}
      <div><label htmlFor="business" className="label">Business or brand name</label><input id="business" name="business" maxLength={80} className="field" required /></div>
      <div><label htmlFor="title" className="label">Headline</label><input id="title" name="title" maxLength={80} className="field" required /></div>
      <div><label htmlFor="adbody" className="label">What are you offering?</label><textarea id="adbody" name="body" rows={3} maxLength={300} className="field py-3" required /></div>
      <div><label htmlFor="link" className="label">Where should people go when they tap?</label><input id="link" name="link" type="url" inputMode="url" placeholder="https://" className="field" required /></div>
      <div>
        <label htmlFor="placement" className="label">Where to show it</label>
        <select id="placement" name="placement" defaultValue="feed" className="field"><option value="feed">Home feed</option><option value="discover">Discover</option><option value="gossip">Gossip</option></select>
      </div>
      <div><span className="label">Image <span className="font-normal text-muted">(optional, JPEG/PNG/WebP up to 3 MB)</span></span><ImagePicker name="image" maxMB={3} resetKey={state?.ok ? 1 : 0} /></div>
      <div><label htmlFor="contact" className="label">Phone or email for us to reach you</label><input id="contact" name="contact" maxLength={120} className="field" required /></div>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="terms" className="mt-1" /> <span>My ad is honest, legal in Kenya, and has no adult, hateful or misleading content. I understand Jenny may reject or remove it.</span></label>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Sending…" : "Send for review"}</button>
    </form>
  );
}
