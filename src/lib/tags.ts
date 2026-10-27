const TOKEN = /(^|[^A-Za-z0-9_])([#@])([A-Za-z0-9_]{2,30})/g;

/** Unique lowercase #hashtags and @mentions found in a text. */
export function extractTokens(text: string): { tags: string[]; mentions: string[] } {
  const tags = new Set<string>();
  const mentions = new Set<string>();
  for (const m of text.matchAll(TOKEN)) {
    const word = (m[3] ?? "").toLowerCase();
    if (m[2] === "#") tags.add(word); else mentions.add(word);
  }
  return { tags: [...tags].slice(0, 10), mentions: [...mentions].slice(0, 10) };
}

export type Piece = { text: string; kind?: "tag" | "mention" };

export function splitTokens(text: string): Piece[] {
  const out: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = (m.index ?? 0) + (m[1]?.length ?? 0);
    if (start > last) out.push({ text: text.slice(last, start) });
    out.push({ text: `${m[2]}${m[3]}`, kind: m[2] === "#" ? "tag" : "mention" });
    last = start + 1 + (m[3]?.length ?? 0);
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
