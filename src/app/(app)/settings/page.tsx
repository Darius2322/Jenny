import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound, Bell, ShieldCheck, Palette, KeyRound, Database, ChevronRight } from "lucide-react";
import { getUserCached } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

const items = [
  { href: "/settings/profile", label: "Profile and photos", hint: "Name, bio, photo, cover, visibility", icon: UserRound },
  { href: "/settings/notifications", label: "Notifications", hint: "Choose what alerts you get", icon: Bell },
  { href: "/settings/privacy", label: "Privacy and safety", hint: "Blocked people, gossip aka, dating", icon: ShieldCheck },
  { href: "/settings/appearance", label: "Appearance", hint: "Light, dark or match your phone", icon: Palette },
  { href: "/settings/security", label: "Security", hint: "Password and sign-out everywhere", icon: KeyRound },
  { href: "/settings/account", label: "Account and data", hint: "Download your data, delete account", icon: Database },
] as const;

export default async function SettingsPage() {
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Settings</h1>
      <p className="px-5 pt-1 text-sm text-muted">Signed in as {user.email}</p>
      <ul className="card mx-4 mt-5 divide-y divide-line overflow-hidden dark:divide-white/10">
        {items.map(({ href, label, hint, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-[64px] items-center gap-3 px-4 hover:bg-surface dark:hover:bg-white/10">
              <span className="chip !h-10 !w-10 !rounded-xl"><Icon size={18} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span><span className="block truncate text-sm text-muted">{hint}</span></span>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="pb-6" />
    </>
  );
}
