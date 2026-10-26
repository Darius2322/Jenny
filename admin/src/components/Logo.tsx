type Props = { className?: string; tagline?: boolean; size?: number };

/**
 * Jenny wordmark. The two-tone green J emblem REPLACES the first letter: it renders "J" + "enny",
 * never an emblem followed by a second J. Keep in sync with /public/brand/*.svg.
 */
const DARK = "M220 382 L220 407 L222 419 L227 435 L237 454 L243 462 L263 481 L280 491 L304 499 L319 501 L342 500 L359 496 L377 488 L393 477 L407 463 L417 449 L426 429 L426 425 L425 425 L412 438 L395 446 L390 447 L370 446 L350 436 L339 424 L333 413 L330 403 L329 382 L328 380 L324 378 L224 378Z";
const LIGHT = "M487 190 L482 190 L480 192 L480 411 L479 412 L479 426 L476 442 L469 462 L463 474 L453 489 L427 515 L410 526 L386 536 L368 540 L334 541 L316 538 L300 533 L281 524 L269 516 L248 496 L244 497 L245 501 L254 514 L276 537 L290 548 L311 560 L338 570 L364 575 L399 575 L434 567 L459 556 L475 546 L490 534 L511 511 L527 485 L537 459 L543 427 L543 227 L537 220Z";
const W = 323;
const H = 385;

export function JennyEmblem({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={(size * W) / H} height={size} viewBox="220 190 323 385" aria-hidden="true" className={className}>
      <path d={DARK} fill="#126F5A" />
      <path d={LIGHT} fill="#1FCB77" />
    </svg>
  );
}

export function Logo({ className = "", tagline = false, size = 36 }: Props) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`} role="img" aria-label="Jenny">
      <span className="inline-flex items-end">
        <JennyEmblem size={size} className="mr-[0.04em]" />
        <span
          aria-hidden="true"
          className="font-extrabold tracking-tight text-ink dark:text-white"
          style={{ fontSize: size * 0.95, lineHeight: 1, letterSpacing: "-0.04em", paddingBottom: size * 0.05 }}
        >
          enny
        </span>
      </span>
      {tagline && (
        <span aria-hidden="true" className="mt-1 text-xs font-medium tracking-wider text-muted" style={{ marginLeft: size * 0.85 }}>
          Connect. Discover. Belong.
        </span>
      )}
    </span>
  );
}
