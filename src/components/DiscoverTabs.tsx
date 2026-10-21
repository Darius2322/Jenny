import Link from "next/link";

export function DiscoverTabs({ active }: { active: "people" | "businesses" | "news" }) {
  const tabs = [{ id: "people", label: "People", href: "/discover" }, { id: "businesses", label: "Businesses", href: "/businesses" }, { id: "news", label: "News", href: "/news" }] as const;
  return (
    <nav aria-label="Discover sections" className="mt-3 flex gap-1 border-b border-line px-4 dark:border-white/10">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} aria-current={active === t.id ? "page" : undefined}
          className={`min-h-[44px] border-b-2 px-3 py-2.5 text-sm font-semibold ${active === t.id ? "border-brand text-ink dark:text-white" : "border-transparent text-muted"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
