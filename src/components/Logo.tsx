type Props = { className?: string; tagline?: boolean; size?: number };

/**
 * Jenny wordmark. The teal J emblem REPLACES the first letter: it renders "J" + "enny",
 * never an emblem followed by a second J. Keep in sync with /public/brand/*.svg.
 */
export function JennyEmblem({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path
        d="M41 10v28c0 9-6 15-15 15-6 0-10-3-12-7"
        fill="none" stroke="#00BFA6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = "", tagline = false, size = 36 }: Props) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`} role="img" aria-label="Jenny">
      <span className="inline-flex items-end">
        <JennyEmblem size={size} className="-mr-[0.12em]" />
        <span
          aria-hidden="true"
          className="font-extrabold tracking-tight text-ink dark:text-white"
          style={{ fontSize: size * 0.95, lineHeight: 1, letterSpacing: "-0.03em", paddingBottom: size * 0.06 }}
        >
          enny
        </span>
      </span>
      {tagline && (
        <span aria-hidden="true" className="mt-1 text-xs font-medium tracking-wider text-muted" style={{ marginLeft: size * 0.9 }}>
          Connect. Discover. Belong.
        </span>
      )}
    </span>
  );
}
