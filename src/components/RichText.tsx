import Link from "next/link";
import { splitTokens } from "@/lib/tags";

/** Plain text with tappable #hashtags and @mentions. Rendered as React elements, never as HTML. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitTokens(text).map((p, i) =>
        p.kind === "tag" ? <Link key={i} href={`/tag/${p.text.slice(1).toLowerCase()}`} className="font-semibold text-brand-dark hover:underline dark:text-brand">{p.text}</Link>
        : p.kind === "mention" ? <Link key={i} href={`/u/${p.text.slice(1).toLowerCase()}`} className="font-semibold text-brand-dark hover:underline dark:text-brand">{p.text}</Link>
        : <span key={i}>{p.text}</span>)}
    </>
  );
}
