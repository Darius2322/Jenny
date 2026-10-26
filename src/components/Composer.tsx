"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createPost, addComment, type ActionState } from "@/lib/actions";
import { ImagePicker } from "./ImagePicker";

type Props = { mode?: "post" | "comment"; postId?: string; parentId?: string; placeholder?: string; max?: number };

export function Composer({ mode = "post", postId, parentId, placeholder, max }: Props) {
  const limit = max ?? (mode === "post" ? 2000 : 1000);
  const [state, action, pending] = useActionState<ActionState, FormData>(mode === "post" ? createPost : addComment, undefined);
  const [text, setText] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state?.ok) {
      setText(""); setResetKey((k) => k + 1); setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 8000);
    }
  }, [state]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const id = `composer-${mode}-${parentId ?? "root"}`;
  const label = mode === "post" ? "What's on your mind?" : "Write a comment";
  const empty = text.trim().length === 0;

  return (
    <form action={action} className="border-b border-line px-4 py-4 dark:border-white/10" onChange={() => done && setDone(false)}>
      {postId && <input type="hidden" name="postId" value={postId} />}
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label htmlFor={id} className="sr-only">{label}</label>
      <textarea id={id} name="body" rows={mode === "post" ? 3 : 2} maxLength={limit} required
        placeholder={placeholder ?? label} value={text} onChange={(e) => setText(e.target.value)}
        className="field min-h-[80px] resize-none py-3" />
      {mode === "post" && <div className="mt-3"><ImagePicker name="image" maxMB={5} resetKey={resetKey} /></div>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-xs ${limit - text.length < 50 ? "text-red-600" : "text-muted"}`} aria-live="polite">{limit - text.length} left</span>
        <button type="submit" disabled={pending || empty} className="btn btn-primary">{pending ? "Posting…" : mode === "post" ? "Post" : "Reply"}</button>
      </div>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {done && state?.ok && (
        <p role="status" className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand">
          <CheckCircle2 size={20} aria-hidden="true" />
          {mode === "post" ? "Your post is live." : "Reply sent."}
          {mode === "post" && state.postId && <Link href={`/post/${state.postId}`} className="ml-auto underline">View post</Link>}
        </p>
      )}
    </form>
  );
}
