"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { FormState } from "@/app/auth/actions";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

type Field = { name: string; label: string; type?: string; autoComplete?: string; hint?: string };

type Common = { value: string; onChange: (v: string) => void; error?: string };

function PasswordInput({ f, value, onChange, error }: { f: Field } & Common) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={f.name} name={f.name} type={show ? "text" : "password"} autoComplete={f.autoComplete} required className={`field pr-14 ${error ? "!border-red-500" : ""}`}
        value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${f.name}-err` : f.hint ? `${f.name}-hint` : undefined} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink dark:hover:text-white">
        {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}

export function AuthForm(props: {
  title: string;
  subtitle?: string;
  submitLabel: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  hidden?: Record<string, string>;
  terms?: boolean;
  footer?: React.ReactNode;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(props.action, undefined);
  // Controlled values: a failed submit keeps everything the person typed.
  const [values, setValues] = useState<Record<string, string>>({});
  const [terms, setTerms] = useState(false);
  const errs = state?.fieldErrors ?? {};

  // Jump straight to the first wrong field.
  useEffect(() => {
    const first = props.fields.find((f) => errs[f.name])?.name ?? (errs.acceptTerms ? "acceptTerms" : null);
    if (!first) return;
    const el = document.getElementById(first);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    (el as HTMLInputElement | null)?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-night">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-brand-dark/50 blur-3xl" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex h-36 items-center justify-between px-6">
          <Link href="/" aria-label="Jenny home" className="[&_span]:!text-white"><Logo size={38} /></Link>
          <ThemeToggle />
        </div>
        <main id="main" className="flex-1 rounded-t-4xl bg-[#FAFBFC] px-6 pb-10 pt-8 dark:bg-slate-900 md:mb-10 md:flex-none md:rounded-4xl">
          <h1 className="text-3xl font-extrabold">{props.title}</h1>
          {props.subtitle && <p className="mt-2 text-muted">{props.subtitle}</p>}
          {props.notice && <p role="status" className="mt-4 rounded-2xl bg-brand-tint p-4 text-sm text-brand-deep dark:bg-brand/15 dark:text-brand">{props.notice}</p>}

          {state?.message ? (
            <p role="status" className="mt-6 rounded-2xl border border-brand bg-brand-tint p-5 text-sm leading-relaxed text-brand-deep dark:bg-brand/10 dark:text-brand">{state.message}</p>
          ) : (
            <form action={formAction} className="mt-7 space-y-5" noValidate>
              {Object.entries(props.hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              {props.fields.map((f) => (
                <div key={f.name}>
                  <label htmlFor={f.name} className="label">{f.label}</label>
                  {f.type === "password" ? <PasswordInput f={f} value={values[f.name] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} error={errs[f.name]} /> : (
                    <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required className={`field ${errs[f.name] ? "!border-red-500" : ""}`}
                      value={values[f.name] ?? ""} onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))} aria-invalid={errs[f.name] ? true : undefined}
                      aria-describedby={errs[f.name] ? `${f.name}-err` : f.hint ? `${f.name}-hint` : undefined} />
                  )}
                  {errs[f.name] ? <p id={`${f.name}-err`} role="alert" className="mt-1.5 px-1 text-xs font-semibold text-red-600 dark:text-red-400">{errs[f.name]}</p>
                    : f.hint && <p id={`${f.name}-hint`} className="mt-1.5 px-1 text-xs text-muted">{f.hint}</p>}
                </div>
              ))}
              {props.terms && (
                <label className="flex items-start gap-3 text-sm">
                  <input id="acceptTerms" type="checkbox" name="acceptTerms" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1" />
                  <span>I agree to the <Link href="/terms" className="font-semibold text-brand-dark underline dark:text-brand">Terms</Link> and <Link href="/privacy" className="font-semibold text-brand-dark underline dark:text-brand">Privacy Policy</Link>.</span>
                </label>
              )}
              {errs.acceptTerms && <p role="alert" className="-mt-2 px-1 text-xs font-semibold text-red-600 dark:text-red-400">{errs.acceptTerms}</p>}
              {state?.error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{state.error}</p>}
              <button type="submit" disabled={pending} className="btn btn-primary w-full !min-h-[54px] text-base">{pending ? "Please wait…" : props.submitLabel}</button>
            </form>
          )}
          {props.footer && <div className="mt-7 text-center text-sm text-muted">{props.footer}</div>}
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink dark:hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
        </main>
      </div>
    </div>
  );
}
