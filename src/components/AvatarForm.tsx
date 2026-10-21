"use client";

import { useActionState } from "react";
import { updateAvatar, removeAvatar, type ActionState } from "@/lib/actions";
import { Avatar } from "./Avatar";

export function AvatarForm({ name, path }: { name: string; path: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateAvatar, undefined);
  return (
    <section aria-labelledby="avatar-heading" className="flex items-center gap-4 border-b border-line px-4 py-5 dark:border-white/10">
      <Avatar name={name} path={path} size={72} />
      <div className="min-w-0 flex-1">
        <h2 id="avatar-heading" className="font-semibold">Profile photo</h2>
        <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
          <label htmlFor="avatar" className="sr-only">Choose a profile photo (JPEG, PNG or WebP, max 2 MB)</label>
          <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className="max-w-full text-sm" />
          <button type="submit" disabled={pending} className="btn btn-secondary !min-h-[40px]">{pending ? "Uploading…" : "Upload"}</button>
        </form>
        {path && (
          <form action={removeAvatar} className="mt-1"><button type="submit" className="text-sm text-muted underline">Remove photo</button></form>
        )}
        {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-brand-dark dark:text-brand">Photo updated.</p>}
      </div>
    </section>
  );
}
