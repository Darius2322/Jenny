/** Only allow same-origin relative paths; blocks open redirects such as //evil.com or /\evil.com. */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/home"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
