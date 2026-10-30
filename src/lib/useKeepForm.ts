"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";

type S = { error?: string; field?: string } | undefined;

/**
 * Submit a server action WITHOUT letting React reset the form afterwards.
 * Everything the person typed stays put; if the server names a wrong field, focus jumps to it.
 */
export function useKeepForm<T extends S>(action: (state: T, formData: FormData) => Promise<T>) {
  const [state, run, pending] = useActionState<T, FormData>(action, undefined as T);
  const formEl = useRef<HTMLFormElement | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    formEl.current = e.currentTarget;
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => run(fd));
  }

  useEffect(() => {
    const form = formEl.current;
    if (!form) return;
    form.querySelectorAll("[aria-invalid]").forEach((n) => n.removeAttribute("aria-invalid"));
    const name = state?.field;
    if (!name) return;
    const el = form.elements.namedItem(name);
    const target = (el instanceof RadioNodeList ? el[0] : el) as HTMLElement | null;
    if (!target) return;
    target.setAttribute("aria-invalid", "true");
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    target.focus({ preventScroll: true });
  }, [state]);

  return [state, onSubmit, pending] as const;
}
