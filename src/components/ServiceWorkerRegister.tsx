"use client";

import { useEffect, useState } from "react";

/** Registers /sw.js and offers (never forces) a refresh when a new version is waiting. */
export function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      if (reg.waiting) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        sw?.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
        });
      });
    }).catch(() => { /* registration failure must never break the app */ });
  }, []);

  if (!waiting) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg md:bottom-4">
      <span>A new version of Jenny is available.</span>
      <button
        type="button"
        className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-ink"
        onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
      >
        Refresh
      </button>
    </div>
  );
}
