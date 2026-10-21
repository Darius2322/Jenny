"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/auth/actions";
import { Logo } from "./Logo";

type Field = { name: string; label: string; type?: string; autoComplete?: string; hint?: string };

export function AuthForm(props: {
  title: string;
  submitLabel: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  hidden?: Record<string, string>;
  terms?: boolean;
  footer?: React.ReactNode;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(props.action, undefined);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" aria-label="Jenny home" className="mb-8 self-center"><Logo size={40} /></Link>
      <h1 className="text-2xl font-bold">{props.title}</h1>
      {props.notice && <p role="status" className="mt-3 rounded-xl bg-surface p-3 text-sm dark:bg-white/10">{props.notice}</p>}

      {state?.message ? (
        <p role="status" className="mt-6 rounded-xl border border-brand p-4 text-sm">{state.message}</p>
      ) : (
        <form action={formAction} className="mt-6 space-y-4" noValidate>
          {Object.entries(props.hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {props.fields.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="label">{f.label}</label>
              <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required className="field" aria-describedby={f.hint ? `${f.name}-hint` : undefined} />
              {f.hint && <p id={`${f.name}-hint`} className="mt-1 text-xs text-muted">{f.hint}</p>}
            </div>
          ))}
          {props.terms && (
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="acceptTerms" required className="mt-1 h-4 w-4 accent-[#00BFA6]" />
              <span>I agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</span>
            </label>
          )}
          {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Please wait…" : props.submitLabel}</button>
        </form>
      )}
      {props.footer && <div className="mt-6 text-center text-sm text-muted">{props.footer}</div>}
    </main>
  );
}
