"use client";

import { useEffect, useState, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { saveTheme } from "@/lib/actions";

const OPTIONS = [{ v: "system", l: "Match my phone", i: Monitor }, { v: "light", l: "Light", i: Sun }, { v: "dark", l: "Dark", i: Moon }] as const;

function apply(v: string) {
  const dark = v === "dark" || (v === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  try { if (v === "system") localStorage.removeItem("jenny-theme"); else localStorage.setItem("jenny-theme", v); } catch { /* storage unavailable */ }
}

export function ThemeChoice({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [, start] = useTransition();
  useEffect(() => { apply(initial); }, [initial]);
  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-3 px-5 py-4">
      {OPTIONS.map(({ v, l, i: Icon }) => (
        <button key={v} type="button" role="radio" aria-checked={value === v}
          onClick={() => { setValue(v); apply(v); start(async () => { await saveTheme(v); }); }}
          className={`flex min-h-[60px] items-center gap-4 rounded-2xl border px-4 text-left font-medium transition ${value === v ? "border-brand-dark bg-brand-tint text-brand-deep dark:bg-brand/15 dark:text-brand" : "border-line dark:border-white/15"}`}>
          <Icon size={22} aria-hidden="true" />{l}
        </button>
      ))}
    </div>
  );
}
