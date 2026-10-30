"use client";

import { useKeepForm } from "@/lib/useKeepForm";
import { createBusiness, updateBusiness, type BizState } from "@/lib/business-actions";
import { BUSINESS_CATEGORIES, type Business } from "@/lib/business";

export function BusinessForm({ business }: { business?: Business }) {
  const [state, onSubmit, pending] = useKeepForm<BizState>(business ? updateBusiness : createBusiness);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {business && <input type="hidden" name="businessId" value={business.id} />}
      {!business && (
        <div>
          <label htmlFor="handle" className="label">Business handle</label>
          <input id="handle" name="handle" required maxLength={30} autoCapitalize="none" className="field" aria-describedby="handle-hint" />
          <p id="handle-hint" className="mt-1 text-xs text-muted">Your public address, e.g. jenny.app/businesses/<em>yourhandle</em>. Letters, numbers, underscores. Can&apos;t be changed later.</p>
        </div>
      )}
      <div>
        <label htmlFor="name" className="label">Business name</label>
        <input id="name" name="name" required maxLength={80} defaultValue={business?.name} className="field" />
      </div>
      <div>
        <label htmlFor="category" className="label">Category</label>
        <select id="category" name="category" required defaultValue={business?.category ?? ""} className="field">
          <option value="" disabled>Choose a category</option>
          {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="label">About your business</label>
        <textarea id="description" name="description" rows={4} maxLength={1000} defaultValue={business?.description ?? ""} className="field py-3" />
      </div>
      <div>
        <label htmlFor="location_text" className="label">Location <span className="font-normal text-muted">(general area)</span></label>
        <input id="location_text" name="location_text" maxLength={80} defaultValue={business?.location_text ?? ""} placeholder="e.g. Westlands, Nairobi" className="field" />
      </div>
      <fieldset className="space-y-4 rounded-xl border border-line p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-semibold">Public contact details <span className="font-normal text-muted">(optional)</span></legend>
        <p className="text-xs text-muted">Only what you enter here is shown publicly. Leave blank to receive enquiries through Jenny only.</p>
        <div>
          <label htmlFor="website" className="label">Website</label>
          <input id="website" name="website" type="url" maxLength={200} defaultValue={business?.website ?? ""} placeholder="https://" className="field" />
        </div>
        <div>
          <label htmlFor="public_email" className="label">Public email</label>
          <input id="public_email" name="public_email" type="email" maxLength={120} defaultValue={business?.public_email ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="public_phone" className="label">Public phone</label>
          <input id="public_phone" name="public_phone" type="tel" maxLength={20} defaultValue={business?.public_phone ?? ""} className="field" />
        </div>
      </fieldset>
      {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-medium text-brand-dark dark:text-brand">Saved.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Saving…" : business ? "Save changes" : "Create business profile"}</button>
    </form>
  );
}
