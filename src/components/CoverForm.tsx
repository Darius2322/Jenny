"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { updateCover, removeCover, type ActionState } from "@/lib/actions";
import { coverUrl } from "@/lib/media";
import { ImagePicker } from "./ImagePicker";

export function CoverForm({ path }: { path: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCover, undefined);
  const url = coverUrl(path);
  const [has, setHas] = useState(false);
  return (
    <section aria-labelledby="cover-heading" className="border-b border-line px-4 py-5 dark:border-white/10">
      <h2 id="cover-heading" className="font-semibold">Cover photo</h2>
      {url && <Image src={url} alt="Your current cover photo" width={900} height={300} className="mt-2 h-28 w-full rounded-3xl object-cover" />}
      <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
        <div className="w-full"><ImagePicker name="cover" label="Choose cover photo" maxMB={4} aspect="wide" required resetKey={state} onPick={setHas} /></div>
        {has && <button type="submit" disabled={pending} className="btn btn-primary !min-h-[40px]">{pending ? "Uploading…" : "Save cover"}</button>}
      </form>
      {path && <form action={removeCover} className="mt-1"><button type="submit" className="text-sm text-muted underline">Remove cover photo</button></form>}
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-brand-dark dark:text-brand">Cover photo updated.</p>}
    </section>
  );
}
