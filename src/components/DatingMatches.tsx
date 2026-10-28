"use client";

import { useMemo, useState, useTransition } from "react";
import { Pin, PinOff } from "lucide-react";
import { pinMatch, startConversation } from "@/lib/actions";
import { Avatar } from "./Avatar";

export type MatchRow = { user_id: string; username: string; display_name: string; avatar_path: string | null; age: number; is_pinned: boolean };

export function DatingMatches({ initial }: { initial: MatchRow[] }) {
  const [pins, setPins] = useState(() => new Set(initial.filter((m) => m.is_pinned).map((m) => m.user_id)));
  const [, start] = useTransition();
  const list = useMemo(() => [...initial.filter((m) => pins.has(m.user_id)), ...initial.filter((m) => !pins.has(m.user_id))], [initial, pins]);

  function toggle(id: string) {
    const next = !pins.has(id);
    setPins((p) => { const n = new Set(p); if (next) n.add(id); else n.delete(id); return n; });
    start(async () => { const ok = await pinMatch(id, next); if (!ok) setPins((p) => { const n = new Set(p); if (next) n.delete(id); else n.add(id); return n; }); });
  }

  if (list.length === 0) return <p className="px-6 py-14 text-center text-muted">No matches yet. When you and someone both like each other, they appear here.</p>;
  return (
    <ul className="mt-3 divide-y divide-line dark:divide-white/10">
      {list.map((m) => (
        <li key={m.user_id} className="flex items-center gap-3 px-5 py-3">
          <Avatar name={m.display_name} path={m.avatar_path} size={52} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate font-semibold">{m.display_name}, {m.age}{pins.has(m.user_id) && <Pin size={13} className="shrink-0 text-brand-dark dark:text-brand" aria-label="Pinned" />}</span>
            <span className="block truncate text-sm text-muted">@{m.username}</span>
          </span>
          <button type="button" onClick={() => toggle(m.user_id)} aria-pressed={pins.has(m.user_id)} aria-label={pins.has(m.user_id) ? `Unpin ${m.display_name}` : `Pin ${m.display_name}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10">
            {pins.has(m.user_id) ? <PinOff size={18} aria-hidden="true" /> : <Pin size={18} aria-hidden="true" />}
          </button>
          <form action={startConversation}><input type="hidden" name="targetId" value={m.user_id} /><button type="submit" className="btn btn-primary !min-h-[40px]">Message</button></form>
        </li>
      ))}
    </ul>
  );
}
