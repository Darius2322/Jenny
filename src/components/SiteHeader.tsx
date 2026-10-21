import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Jenny home"><Logo size={32} /></Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn-secondary !px-4">Sign in</Link>
          <Link href="/register" className="btn btn-primary !px-4">
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
    <footer className="border-t border-line dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo size={28} tagline />
          <p className="text-xs text-muted">© {new Date().getFullYear()} Jenny. All rights reserved.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {links.map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-ink dark:hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
