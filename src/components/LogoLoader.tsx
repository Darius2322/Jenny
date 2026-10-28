import { JennyEmblem } from "./Logo";

/**
 * Jenny's loader: the J draws itself stroke by stroke (dark hook, then the light sweep) and fills in,
 * then quietly resets. The path data comes from the real logo, so it is the brand mark, not a generic spinner.
 */
export function LogoLoader({ label = "Loading", fill = false }: { label?: string; fill?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center justify-center ${fill ? "min-h-dvh" : "min-h-[60vh]"}`}>
      <JennyEmblem size={84} draw />
      <span className="sr-only">{label}…</span>
    </div>
  );
}
