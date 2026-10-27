import { JennyEmblem } from "./Logo";

/** Branded loading state: the Jenny J pulses over a soft sweeping bar. */
export function LogoLoader({ label = "Loading", fill = false }: { label?: string; fill?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-5 ${fill ? "min-h-dvh" : "min-h-[60vh]"}`}>
      <JennyEmblem size={64} className="logo-pulse" />
      <div aria-hidden="true" className="h-1 w-28 overflow-hidden rounded-full bg-brand-tint dark:bg-white/10">
        <div className="logo-sweep h-full w-1/3 rounded-full bg-brand" />
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  );
}
