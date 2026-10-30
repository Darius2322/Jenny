"use client";

import { useEffect, useRef } from "react";
import { useKeepForm } from "@/lib/useKeepForm";
import { addListing, type BizState } from "@/lib/business-actions";

export function ListingForm({ businessId }: { businessId: string }) {
  const [state, onSubmit, pending] = useKeepForm<BizState>(addListing);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3 rounded-xl border border-line p-4 dark:border-white/10">
      <input type="hidden" name="businessId" value={businessId} />
      <h3 className="font-semibold">Add a product or service</h3>
      <div>
        <label htmlFor="l-title" className="label">Title</label>
        <input id="l-title" name="title" required maxLength={120} className="field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="l-kind" className="label">Type</label>
          <select id="l-kind" name="kind" defaultValue="product" className="field"><option value="product">Product</option><option value="service">Service</option></select>
        </div>
        <div>
          <label htmlFor="l-price" className="label">Price <span className="font-normal text-muted">(optional)</span></label>
          <input id="l-price" name="price_text" maxLength={40} placeholder="e.g. KES 1,500" className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="l-desc" className="label">Description</label>
        <textarea id="l-desc" name="description" rows={3} maxLength={1500} className="field py-3" />
      </div>
      <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="publish" /> Publish now (otherwise saved as a draft)</label>
      {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-medium text-brand-dark dark:text-brand">Listing added.</p>}
      <button type="submit" disabled={pending} className="btn btn-secondary w-full">{pending ? "Adding…" : "Add listing"}</button>
    </form>
  );
}
