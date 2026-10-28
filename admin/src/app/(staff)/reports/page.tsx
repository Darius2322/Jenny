import Link from "next/link";
import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { loadTargets } from "@/lib/preview";

export const metadata = { title: "Reports" };

type Report = { id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string };
const TABS = [["open", "Open"], ["resolved", "Resolved"], ["all", "All"]] as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ view?: string; type?: string }> }) {
  await requireStaff(MODERATION);
  const { view = "open", type = "" } = await searchParams;
  const svc = createServiceClient();
  let req = svc.from("content_reports").select("id, target_type, target_id, reason, status, created_at").limit(60);
  if (view === "open") req = req.in("status", ["open", "reviewing"]).order("created_at", { ascending: true });
  else { if (view === "resolved") req = req.in("status", ["actioned", "dismissed"]); req = req.order("created_at", { ascending: false }); }
  if (type) req = req.eq("target_type", type);
  const { data } = await req;
  const reports = (data ?? []) as Report[];
  const previews = await loadTargets(reports);
  const types = ["post", "comment", "profile", "business", "gossip"];

  return (
    <>
      <h1 className="text-2xl font-extrabold">Reports</h1>
      <p className="mt-1 text-sm text-muted">Open reports are oldest first. Open one to see the full context and decide.</p>
      <nav aria-label="Views" className="mt-4 flex flex-wrap gap-2">
        {TABS.map(([id, label]) => <Link key={id} href={`/reports?view=${id}${type ? `&type=${type}` : ""}`} aria-current={view === id ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${view === id ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{label}</Link>)}
        <span className="mx-1 w-px bg-line dark:bg-white/10" />
        {["", ...types].map((t) => <Link key={t || "any"} href={`/reports?view=${view}${t ? `&type=${t}` : ""}`} className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${type === t ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-surface text-muted dark:bg-white/10"}`}>{t || "any type"}</Link>)}
      </nav>
      {reports.length === 0 && <p className="mt-10 text-center text-muted">Nothing here.</p>}
      <ul className="mt-5 space-y-3">
        {reports.map((r) => {
          const t = previews.get(`${r.target_type}:${r.target_id}`);
          return (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="card block p-4 hover:border-brand">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold capitalize text-white dark:bg-white dark:text-ink">{r.target_type}</span>
                  <strong className="capitalize">{r.reason.replace("_", " ")}</strong>
                  <span className="text-muted">· {new Date(r.created_at).toLocaleString("en-KE")} · {r.status}</span>
                </p>
                <p className="mt-2 line-clamp-2 break-words text-sm text-muted">{t ? t.text : "Content no longer exists."}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
