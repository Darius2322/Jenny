"use client";

/** Accessible on/off switch that still submits as a normal form field (name=value "on"). */
export function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-[60px] cursor-pointer items-center gap-4 border-b border-line px-5 py-3 last:border-0 dark:border-white/10">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} role="switch" className="peer sr-only" />
      <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-dark peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand dark:bg-white/20 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
