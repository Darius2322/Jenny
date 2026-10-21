"use client";

import { useActionState } from "react";
import { staffLogin, type LoginState } from "@/lib/auth-actions";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(staffLogin, undefined);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <Logo size={40} />
      <h1 className="mt-6 text-xl font-bold">Staff sign-in</h1>
      <p className="mt-1 text-sm text-muted">Authorised Jenny staff only. All activity is logged.</p>
      <form action={action} className="mt-6 space-y-4">
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="field" /></div>
        <div><label htmlFor="password" className="label">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="field" /></div>
        {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
