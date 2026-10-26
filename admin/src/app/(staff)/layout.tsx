import Link from "next/link";
import { requireStaff, ADMINS } from "@/lib/staff";
import { staffLogout } from "@/lib/auth-actions";
import { Logo } from "@/components/Logo";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const isAdmin = ADMINS.includes(staff.role);
  const links = [
    { href: "/", label: "Overview" }, { href: "/reports", label: "Reports" }, { href: "/businesses", label: "Businesses" },
    { href: "/news", label: "News" }, { href: "/users", label: "Users" }, ...(isAdmin ? [{ href: "/deletions", label: "Deletions" }, { href: "/audit", label: "Audit log" }] : []),
  ];
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line dark:border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo size={28} />
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-ink">Admin</span>
          <nav aria-label="Admin" className="flex flex-1 flex-wrap gap-1">
            {links.map((l) => <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-brand-tint hover:text-brand-deep dark:text-slate-300 dark:hover:bg-white/10">{l.label}</Link>)}
          </nav>
          <span className="text-xs text-muted">{staff.email} · {staff.role.replace("_", " ")}</span>
          <form action={staffLogout}><button type="submit" className="btn btn-secondary !min-h-[36px] !px-3">Sign out</button></form>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
