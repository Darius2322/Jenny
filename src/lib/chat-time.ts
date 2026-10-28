const TZ = "Africa/Nairobi";

const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const dayDiff = (iso: string, now = new Date()) => {
  const a = new Date(`${ymd(new Date(iso))}T00:00:00Z`).getTime();
  const b = new Date(`${ymd(now)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
};

/** 14:05 */
export function clock(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Separator inside a chat: Today, Yesterday, Monday, 12 October 2026. */
export function dayLabel(iso: string): string {
  const diff = dayDiff(iso);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Intl.DateTimeFormat("en-KE", { timeZone: TZ, weekday: "long" }).format(new Date(iso));
  return new Intl.DateTimeFormat("en-KE", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/** Chat list stamp: 14:05, Yesterday, Monday, 12/10/2026. */
export function listStamp(iso: string): string {
  const diff = dayDiff(iso);
  if (diff <= 0) return clock(iso);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Intl.DateTimeFormat("en-KE", { timeZone: TZ, weekday: "long" }).format(new Date(iso));
  return new Intl.DateTimeFormat("en-KE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

export const dayKey = (iso: string) => ymd(new Date(iso));
