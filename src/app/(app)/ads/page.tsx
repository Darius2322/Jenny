import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdForm } from "@/components/AdForm";

export const metadata: Metadata = { title: "Advertise on Jenny", robots: { index: false } };

type Mine = { id: string; title: string; placement: string; status: string; admin_note: string | null; clicks: number; views: number; created_at: string };

export default async function AdsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ad_mine");
  const mine = (data ?? []) as Mine[];
  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Advertise on Jenny</h1>
      <p className="px-5 pt-1 text-sm text-muted">Reach people across Kenya. Every ad is reviewed by our team and labelled &ldquo;Sponsored&rdquo;. Apply below.</p>
      {mine.length > 0 && (
        <section className="px-5 pt-5" aria-label="My ads">
          <h2 className="text-lg font-bold">My applications</h2>
          <ul className="mt-2 space-y-2">
            {mine.map((a) => (
              <li key={a.id} className="rounded-2xl bg-surface p-4 text-sm dark:bg-white/10">
                <p className="font-semibold">{a.title}</p>
                <p className="text-muted capitalize">{a.placement} · {a.status}{a.status === "approved" ? ` · ${a.views} views · ${a.clicks} taps` : ""}</p>
                {a.admin_note && <p className="mt-1">Note from our team: {a.admin_note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <AdForm />
    </>
  );
}
