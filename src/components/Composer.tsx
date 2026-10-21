"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createPost, addComment, type ActionState } from "@/lib/actions";

type Props = { mode?: "post" | "comment"; postId?: string; parentId?: string; placeholder?: string; max?: number };

export function Composer({ mode = "post", postId, parentId, placeholder, max }: Props) {
  const limit = max ?? (mode === "post" ? 2000 : 1000);
  const [state, action, pending] = useActionState<ActionState, FormData>(mode === "post" ? createPost : addComment, undefined);
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state?.ok) { formRef.current?.reset(); setText(""); setFileName(null); }
  }, [state]);

  const label = mode === "post" ? "What's on your mind?" : "Write a comment";
  const empty = text.trim().length === 0;

  return (
    <form ref={formRef} action={action} className="border-b border-line px-4 py-4 dark:border-white/10">
      {postId && <input type="hidden" name="postId" value={postId} />}
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label htmlFor={`composer-${mode}-${parentId ?? "root"}`} className="sr-only">{label}</label>
      <textarea
        id={`composer-${mode}-${parentId ?? "root"}`} name="body" rows={mode === "post" ? 3 : 2} maxLength={limit} required
        placeholder={placeholder ?? label} value={text} onChange={(e) => setText(e.target.value)}
        className="field min-h-[80px] resize-none py-3"
      />
      {mode === "post" && (
        <div className="mt-2 flex items-center gap-2">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-brand-dark hover:bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-brand dark:text-brand dark:hover:bg-white/10">
            <ImagePlus size={20} aria-hidden="true" /> Add photo
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
          </label>
          {fileName && (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs dark:bg-white/10">
              <span className="truncate">{fileName}</span>
              <button type="button" aria-label="Remove photo" className="shrink-0" onClick={() => {
                const input = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
                if (input) input.value = "";
                setFileName(null);
              }}><X size={14} aria-hidden="true" /></button>
            </span>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`text-xs ${limit - text.length < 50 ? "text-red-600" : "text-muted"}`} aria-live="polite">{limit - text.length} left</span>
        <button type="submit" disabled={pending || empty} className="btn btn-primary">{pending ? "Posting…" : mode === "post" ? "Post" : "Reply"}</button>
      </div>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
