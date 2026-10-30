"use client";

import { useEffect, useRef } from "react";
import { useKeepForm } from "@/lib/useKeepForm";
import { changePassword, type ActionState } from "@/lib/actions";

export function PasswordForm() {
  const [state, onSubmit, pending] = useKeepForm<ActionState>(changePassword);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4 px-5 py-5">
      <div><label htmlFor="password" className="label">New password</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="field" /><p className="mt-1 text-xs text-muted">At least 10 characters.</p></div>
      <div><label htmlFor="confirm" className="label">Confirm new password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" /></div>
      {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-semibold text-brand-dark dark:text-brand">Password changed.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
