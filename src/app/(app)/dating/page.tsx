import type { Metadata } from "next";
import { HeartHandshake } from "lucide-react";
import { DiscoverTabs } from "@/components/DiscoverTabs";

export const metadata: Metadata = { title: "Dating", robots: { index: false } };

export default function DatingPage() {
  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Dating</h1>
      <DiscoverTabs active="dating" />
      <div className="px-6 py-16 text-center">
        <span className="chip mx-auto !h-16 !w-16"><HeartHandshake size={30} aria-hidden="true" /></span>
        <p className="mt-5 text-lg font-bold">Coming soon</p>
        <p className="mx-auto mt-2 max-w-sm text-muted">Dating is not available yet. We&apos;re building it carefully with safety and consent first. Nothing is collected and no profile is created.</p>
      </div>
    </>
  );
}
