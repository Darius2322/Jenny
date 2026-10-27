"use client";

import { useRef, useState } from "react";
import { Reply } from "lucide-react";

type Props = {
  children: React.ReactNode;
  onReply?: () => void;
  onMenu?: () => void;
  className?: string;
};

/**
 * Touch gestures for a chat-style item: drag right to reply, press and hold (or right-click) for more options.
 * Vertical scrolling still works because the element only claims horizontal movement.
 */
export function GestureItem({ children, onReply, onMenu, className = "" }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const [dx, setDx] = useState(0);

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const reset = () => { clear(); start.current = null; setDx(0); };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ touchAction: "pan-y", WebkitTouchCallout: "none" }}
      onContextMenu={(e) => { if (onMenu) { e.preventDefault(); onMenu(); } }}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        start.current = { x: e.clientX, y: e.clientY }; fired.current = false;
        if (onMenu) timer.current = setTimeout(() => { fired.current = true; start.current = null; setDx(0); navigator.vibrate?.(12); onMenu(); }, 450);
      }}
      onPointerMove={(e) => {
        const s = start.current; if (!s) return;
        const mx = e.clientX - s.x, my = e.clientY - s.y;
        if (Math.abs(mx) > 10 || Math.abs(my) > 10) clear();
        if (onReply && Math.abs(mx) > Math.abs(my) && mx > 0) setDx(Math.min(mx, 84));
      }}
      onPointerUp={() => {
        const hit = dx >= 56 && !fired.current;
        reset();
        if (hit) { navigator.vibrate?.(8); onReply?.(); }
      }}
      onPointerCancel={reset}
      onPointerLeave={() => { if (dx === 0) clear(); }}
    >
      {dx > 8 && <span aria-hidden="true" className="absolute left-1 top-1/2 -translate-y-1/2 text-brand-dark dark:text-brand" style={{ opacity: Math.min(dx / 56, 1) }}><Reply size={20} /></span>}
      <div style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform .18s ease" }}>{children}</div>
    </div>
  );
}
