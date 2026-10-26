"use client";

import { useActionState, useState } from "react";
import { updateBusinessLogo, removeBusinessLogo, type BizState } from "@/lib/business-actions";
import { BusinessLogo } from "./BusinessLogo";
import { ImagePicker } from "./ImagePicker";

export function BusinessLogoForm({ businessId, name, path }: { businessId: string; name: string; path: string | null }) {
  const [state, action, pending] = useActionState<BizState, FormData>(updateBusinessLogo, undefined);
  const [has, setHas] = useState(false);
  return (
    <section aria-labelledby="logo-heading" className="flex items-center gap-4 border-t border-line px-4 py-5 dark:border-white/10">
      <BusinessLogo name={name} path={path} size={64} />
      <div className="min-w-0 flex-1">
        <h2 id="logo-heading" className="font-semibold">Business logo</h2>
        <form action={action} className="mt-2 flex flex-col items-start gap-2">
          <input type="hidden" name="businessId" value={businessId} />
          <ImagePicker name="logo" label="Choose logo" maxMB={2} aspect="square" required resetKey={state} onPick={setHas} />
          {has && <button type="submit" disabled={pending} className="btn btn-primary !min-h-[40px]">{pending ? "Uploading…" : "Save logo"}</button>}
        </form>
        {path && (
          <form action={removeBusinessLogo} className="mt-1">
            <input type="hidden" name="businessId" value={businessId} />
            <button type="submit" className="text-sm text-muted underline">Remove logo</button>
          </form>
        )}
        {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-brand-dark dark:text-brand">Logo updated.</p>}
      </div>
    </section>
  );
}
