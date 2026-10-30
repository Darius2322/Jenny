"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flag, Users, Store, Newspaper, Trash2, ScrollText, FileText, Ghost, HeartHandshake, ShieldCheck, Megaphone, Zap, Menu, X, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const ICONS = { overview: LayoutDashboard, reports: Flag, users: Users, businesses: Store, news: Newspaper, deletions: Trash2, audit: ScrollText, posts: FileText, gossip: Ghost, dating: HeartHandshake, staff: ShieldCheck, ads: Megaphone, actions: Zap } as const;
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };
export type NavGroup = { title: string; items: NavItem[] };

export function AdminShell({ groups, email, role, logout, children }: {
  groups: NavGroup[]; email: string; role: string; logout: () => Promise<void>; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
      {groups.map((g) => (
        <div key={g.title} className="mt-5">
          <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{g.title}</p>
          <ul>
            {g.items.map(({ href, label, icon, badge }) => {
              const Icon = ICONS[icon];
              const on = active(href);
              return (
                <li key={href}>
                  <Link href={href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined}
                    className={`flex min-h-[42px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${on ? "bg-brand-tint text-brand-deep dark:bg-brand/15 dark:text-brand" : "text-ink/75 hover:bg-surface dark:text-slate-300 dark:hover:bg-white/10"}`}>
                    <Icon size={18} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {badge ? <span className="rounded-full bg-brand-dark px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-4 dark:border-white/10">
      <p className="truncate text-sm font-semibold">{email}</p>
      <p className="text-xs capitalize text-muted">{role.replace("_", " ")}</p>
      <div className="mt-3 flex items-center gap-2">
        <form action={logout} className="flex-1"><button type="submit" className="btn btn-secondary w-full !min-h-[40px]"><LogOut size={16} aria-hidden="true" /> Sign out</button></form>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white dark:border-white/10 dark:bg-slate-900 lg:flex">
        <div className="flex h-16 items-center gap-2 px-5"><Logo size={28} /><span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-ink">Admin</span></div>
        {nav}{footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface dark:bg-white/10"><Menu size={20} aria-hidden="true" /></button>
        <div className="flex items-center gap-2"><Logo size={24} /><span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-ink">Admin</span></div>
        <span className="w-10" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white dark:bg-slate-900">
            <div className="flex h-14 items-center justify-between px-4"><Logo size={26} /><button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface dark:bg-white/10"><X size={20} aria-hidden="true" /></button></div>
            {nav}{footer}
          </div>
        </div>
      )}

      <main id="main" className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
