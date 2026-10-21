"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendEnquiry, type BizState } from "@/lib/business-actions";

export function EnquiryForm({ businessId, listingId, businessName }: { businessId: string; listingId?: string; businessName: string }) {
  const [state, action, pending] = useActionState<BizState, FormData>(sendEnquiry, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  if (state?.ok) {
    return <p role="status" className="rounded-xl border border-brand p-4 text-sm">Your enquiry was sent to {businessName}. They&apos;ll reply through Jenny notifications or the contact details on their profile.</p>;
  }
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <label htmlFor={`enq-${listingId ?? "general"}`} className="label">Your message to {businessName}</label>
      <textarea id={`enq-${listingId ?? "general"}`} name="message" rows={3} required minLength={5} maxLength={1000} className="field py-3" />
      {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Sending…" : "Send enquiry"}</button>
    </form>
  );
}
