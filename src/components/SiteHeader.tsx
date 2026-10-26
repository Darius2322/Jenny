import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={`${dark ? "absolute inset-x-0 top-0 z-40" : "sticky top-0 z-40 border-b border-line bg-[#FAFBFC]/90 backdrop-blur dark:border-white/10 dark:bg-night/90"}`}>
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Jenny home" className={dark ? "[&_span]:!text-white" : ""}><Logo size={34} /></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={`btn !min-h-[44px] !px-5 ${dark ? "btn-light" : "btn-secondary"}`}>Sign in</Link>
          <Link href="/register" className="btn btn-primary !min-h-[44px] !px-5">
            <span className="hidden sm:inline">Create account</span>
            <span className="sm:hidden">Join</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const links = [
    ["About", "/about"], ["Community guidelines", "/community-guidelines"], ["Safety", "/safety"],
    ["Privacy", "/privacy"], ["Terms", "/terms"], ["Help", "/help"], ["Contact", "/contact"],
  ] as const;
  return (
    <footer className="border-t border-line bg-white dark:border-white/10 dark:bg-night">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo size={32} tagline />
          <p className="text-xs text-muted">© {new Date().getFullYear()} Jenny. All rights reserved.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted">
            {links.map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-ink dark:hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
