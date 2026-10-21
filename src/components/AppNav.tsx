"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, MessageCircle, User, Bell, Settings, Store } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const primary = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

const secondary = [
  { href: "/business", label: "My business", icon: Store },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/") || (href === "/profile" && pathname.startsWith("/u/"));
}

export function AppNav({ unread }: { unread: number }) {
  const isActive = useActive();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line px-4 py-6 dark:border-white/10 md:flex">
        <Link href="/home" aria-label="Jenny home" className="mb-8 px-2"><Logo size={34} /></Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {[...primary, ...secondary].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium hover:bg-surface dark:hover:bg-white/10 ${isActive(href) ? "bg-surface font-semibold dark:bg-white/10" : ""}`}>
              <span className="relative">
                <Icon size={22} aria-hidden="true" className={isActive(href) ? "text-brand-dark dark:text-brand" : "text-muted"} />
                {href === "/notifications" && unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />}
              </span>
              {label}
              {href === "/notifications" && unread > 0 && <span className="sr-only"> ({unread} unread)</span>}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-night/90 md:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Link href="/home" aria-label="Jenny home"><Logo size={28} /></Link>
        <div className="flex items-center">
          <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted">
            <Bell size={22} aria-hidden="true" />
            {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />}
          </Link>
          <Link href="/settings" aria-label="Settings" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted"><Settings size={22} aria-hidden="true" /></Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white dark:border-white/10 dark:bg-night md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {primary.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? "page" : undefined} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium">
                <Icon size={href === "/create" ? 30 : 24} aria-hidden="true" className={isActive(href) || href === "/create" ? "text-brand-dark dark:text-brand" : "text-muted"} />
                <span className={isActive(href) ? "text-ink dark:text-white" : "text-muted"}>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
