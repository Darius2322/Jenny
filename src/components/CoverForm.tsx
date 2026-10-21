"use client";

import { useActionState } from "react";
import Image from "next/image";
import { updateCover, removeCover, type ActionState } from "@/lib/actions";
import { coverUrl } from "@/lib/media";

export function CoverForm({ path }: { path: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCover, undefined);
  const url = coverUrl(path);
  return (
    <section aria-labelledby="cover-heading" className="border-b border-line px-4 py-5 dark:border-white/10">
      <h2 id="cover-heading" className="font-semibold">Cover photo</h2>
      {url && <Image src={url} alt="Your current cover photo" width={900} height={300} className="mt-2 h-28 w-full rounded-xl object-cover" />}
      <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor="cover" className="sr-only">Choose a cover photo (JPEG, PNG or WebP, max 4 MB)</label>
        <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" required className="max-w-full text-sm" />
        <button type="submit" disabled={pending} className="btn btn-secondary !min-h-[40px]">{pending ? "Uploading…" : "Upload"}</button>
      </form>
      {path && <form action={removeCover} className="mt-1"><button type="submit" className="text-sm text-muted underline">Remove cover photo</button></form>}
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-brand-dark dark:text-brand">Cover photo updated.</p>}
    </section>
  );
}
