"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, MessageCircle, User, Bell, Store, Search } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const primary = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/messages", label: "DM", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

const secondary = [
  { href: "/business", label: "My business", icon: Store },
  { href: "/notifications", label: "Notifications", icon: Bell },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/") || (href === "/profile" && (pathname.startsWith("/u/") || pathname.startsWith("/settings")));
}

export function AppNav({ unread }: { unread: number }) {
  const isActive = useActive();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white px-4 py-6 dark:border-white/10 dark:bg-night md:flex">
        <Link href="/home" aria-label="Jenny home" className="mb-8 px-2"><Logo size={36} /></Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {[...primary, ...secondary].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
              className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-3.5 text-[15px] font-medium transition-colors hover:bg-surface dark:hover:bg-white/10 ${isActive(href) ? "bg-brand-tint font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand" : "text-ink/80 dark:text-slate-300"}`}>
              <span className="relative">
                <Icon size={22} aria-hidden="true" className={isActive(href) ? "text-brand-dark dark:text-brand" : "text-muted"} />
                {href === "/notifications" && unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white dark:ring-night" aria-hidden="true" />}
              </span>
              {label}
              {href === "/notifications" && unread > 0 && <span className="sr-only"> ({unread} unread)</span>}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-night/90 md:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Link href="/home" aria-label="Jenny home"><Logo size={30} /></Link>
        <div className="flex items-center gap-1">
          <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink dark:bg-white/10 dark:text-white">
            <Bell size={20} aria-hidden="true" />
            {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white dark:ring-night" aria-hidden="true" />}
          </Link>
          <Link href="/search" aria-label="Search" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink dark:bg-white/10 dark:text-white"><Search size={20} aria-hidden="true" /></Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile floating bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-3 z-30 md:hidden" style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <ul className="mx-auto grid max-w-md grid-cols-5 items-center rounded-full border border-line bg-white/95 px-1.5 py-1.5 shadow-nav backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            if (href === "/create") {
              return (
                <li key={href} className="flex justify-center">
                  <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-dark text-white shadow-glow">
                    <Icon size={24} aria-hidden="true" />
                  </Link>
                </li>
              );
            }
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={`mx-auto flex min-h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-semibold ${active ? "bg-brand-tint text-brand-deep dark:bg-brand/15 dark:text-brand" : "text-muted"}`}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
