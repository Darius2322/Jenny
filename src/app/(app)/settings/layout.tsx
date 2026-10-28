import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="px-4 pt-5">
        <Link href="/profile" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold dark:bg-white/10"><ArrowLeft size={16} aria-hidden="true" /> Profile</Link>
      </div>
      {children}
    </>
  );
}
