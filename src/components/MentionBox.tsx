"use client";

import { useEffect, useRef, useState } from "react";
import { searchUsers } from "@/lib/actions";

type Sugg = { username: string; display_name: string };

/** A textarea that suggests people while you type @name. Tapping a suggestion completes the tag. */
export function MentionBox({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const [list, setList] = useState<Sugg[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const seq = useRef(0);

  function current(v: string, caret: number) {
    const m = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,30})$/.exec(v.slice(0, caret));
    return m ? m[2] ?? "" : null;
  }
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const q = current(value, el.selectionStart ?? value.length);
    if (!q) { setList([]); return; }
    const n = ++seq.current;
    const t = setTimeout(() => { void searchUsers(q).then((r) => { if (n === seq.current) setList(r); }); }, 180);
    return () => clearTimeout(t);
  }, [value]);

  function pick(u: string) {
    const el = ref.current; const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([A-Za-z0-9_]{1,30})$/, `@${u} `);
    onChange(before + value.slice(caret)); setList([]); el?.focus();
  }
  return (
    <div className="relative">
      <textarea ref={ref} {...rest} value={value} onChange={(e) => onChange(e.target.value)} />
      {list.length > 0 && (
        <ul role="listbox" aria-label="People to tag" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-soft dark:border-white/10 dark:bg-slate-900">
          {list.map((u) => (
            <li key={u.username}><button type="button" role="option" aria-selected="false" onClick={() => pick(u.username)} className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm hover:bg-surface dark:hover:bg-white/10"><strong>{u.display_name}</strong><span className="text-muted">@{u.username}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
