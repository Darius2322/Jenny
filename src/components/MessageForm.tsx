"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { sendMessage, type ActionState } from "@/lib/actions";

export function MessageForm({ conversationId }: { conversationId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendMessage, undefined);
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) { formRef.current?.reset(); setText(""); }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] border-t border-line bg-white px-4 py-3 dark:border-white/10 dark:bg-night md:bottom-0">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex items-end gap-2">
        <label htmlFor="message-body" className="sr-only">Message</label>
        <textarea id="message-body" name="body" rows={1} maxLength={2000} required value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Write a message" className="field max-h-32 min-h-[44px] resize-none py-2.5" />
        <button type="submit" disabled={pending || text.trim().length === 0} aria-label="Send message" className="btn btn-primary !min-w-[44px] !px-3">
          <SendHorizonal size={20} aria-hidden="true" />
        </button>
      </div>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
