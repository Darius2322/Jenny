"use client";

import { useEffect } from "react";

export type SheetAction = { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean };

export function ActionSheet({ title, actions, onClose }: { title?: string; actions: SheetAction[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title ?? "Options"}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-md rounded-t-4xl bg-white p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-soft dark:bg-slate-900 md:rounded-4xl">
        <div aria-hidden="true" className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line dark:bg-white/20 md:hidden" />
        {title && <p className="truncate px-4 pb-2 pt-1 text-sm text-muted">{title}</p>}
        <ul>
          {actions.map((a) => (
            <li key={a.label}>
              <button type="button" onClick={() => { onClose(); a.onClick(); }}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-4 text-left font-medium hover:bg-surface dark:hover:bg-white/10 ${a.danger ? "text-red-600 dark:text-red-400" : ""}`}>
                {a.icon}{a.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
