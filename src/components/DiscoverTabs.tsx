import Link from "next/link";

export function DiscoverTabs({ active }: { active: "people" | "businesses" | "news" | "gossip" | "dating" }) {
  const tabs = [{ id: "people", label: "People", href: "/discover" }, { id: "businesses", label: "Businesses", href: "/businesses" }, { id: "news", label: "News", href: "/news" }, { id: "gossip", label: "Gossip", href: "/gossip" }, { id: "dating", label: "Dating", href: "/dating" }] as const;
  return (
    <nav aria-label="Discover sections" className="mt-4 flex gap-2 overflow-x-auto border-b border-line px-5 pb-4 dark:border-white/10">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} aria-current={active === t.id ? "page" : undefined}
          className={`inline-flex min-h-[40px] shrink-0 items-center rounded-full px-5 text-sm font-semibold transition-colors ${active === t.id ? "bg-brand-dark text-white shadow-glow" : "bg-surface text-muted hover:text-ink dark:bg-white/10 dark:hover:text-white"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
