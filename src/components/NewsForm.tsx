"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitNews, type NewsState } from "@/lib/news-actions";

export function NewsForm() {
  const [state, action, pending] = useActionState<NewsState, FormData>(submitNews, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  return (
    <details className="border-b border-line px-4 py-4 dark:border-white/10">
      <summary className="cursor-pointer text-sm font-semibold text-brand-dark dark:text-brand">Send a story tip</summary>
      <form ref={ref} action={action} className="mt-3 space-y-3">
        <p className="text-xs text-muted">Tips are reviewed by our team before anything is published. Don&apos;t include accusations about named people, private information, or anything you can&apos;t back up. Include a source link if you have one.</p>
        <div><label htmlFor="n-title" className="label">Headline</label><input id="n-title" name="title" required minLength={5} maxLength={160} className="field" /></div>
        <div><label htmlFor="n-summary" className="label">What happened? (in your own words)</label><textarea id="n-summary" name="summary" rows={4} required minLength={20} maxLength={1500} className="field py-3" /></div>
        <div><label htmlFor="n-source" className="label">Source link <span className="font-normal text-muted">(optional)</span></label><input id="n-source" name="source_url" type="url" maxLength={500} placeholder="https://" className="field" /></div>
        {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm font-medium text-brand-dark dark:text-brand">Thanks. Your tip was sent for review.</p>}
        <button type="submit" disabled={pending} className="btn btn-secondary">{pending ? "Sending…" : "Send tip"}</button>
      </form>
    </details>
  );
}
