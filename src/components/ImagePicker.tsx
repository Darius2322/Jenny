"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type Props = {
  name: string;
  label?: string;
  maxMB: number;
  required?: boolean;
  resetKey?: unknown;
  aspect?: "wide" | "square" | "free";
  onPick?: (has: boolean) => void;
};

const OK = ["image/jpeg", "image/png", "image/webp"];

/** Custom photo picker: no native file control is shown, and the chosen image is previewed before upload. */
export function ImagePicker({ name, label = "Add photo", maxMB, required, resetKey, aspect = "free", onPick }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function clear() {
    if (input.current) input.current.value = "";
    setUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
    setErr(null);
    onPick?.(false);
  }

  useEffect(() => { clear(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [resetKey]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function change(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return clear();
    if (!OK.includes(f.type)) { clear(); setErr("Use a JPEG, PNG or WebP image."); return; }
    if (f.size > maxMB * 1024 * 1024) { clear(); setErr(`That image is over ${maxMB} MB. Choose a smaller one.`); return; }
    setErr(null);
    setUrl((u) => { if (u) URL.revokeObjectURL(u); return URL.createObjectURL(f); });
    onPick?.(true);
  }

  const box = aspect === "wide" ? "aspect-[3/1]" : aspect === "square" ? "aspect-square max-w-[220px]" : "max-h-72";

  return (
    <div>
      <input ref={input} id={`pick-${name}`} type="file" name={name} accept={OK.join(",")} required={required} onChange={change} tabIndex={-1} className="sr-only" aria-hidden="true" />
      {url ? (
        <div className={`relative overflow-hidden rounded-3xl border border-line bg-surface dark:border-white/10 ${aspect === "free" ? "" : box}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote asset */}
          <img src={url} alt="Preview of the photo you chose" className={`w-full object-cover ${aspect === "free" ? box : "h-full"}`} />
          <button type="button" onClick={clear} aria-label="Remove photo" className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-tint px-4 text-sm font-semibold text-brand-deep transition hover:brightness-95 dark:bg-brand/15 dark:text-brand">
          <ImagePlus size={20} aria-hidden="true" /> {label}
        </button>
      )}
      {err && <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{err}</p>}
    </div>
  );
}
