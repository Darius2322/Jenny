import Link from "next/link";
import { requireStaff, MODERATION, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { setGossipStatus } from "@/lib/admin-actions";

export const metadata = { title: "Gossip" };

type G = { id: string; alias: string | null; body: string; status: string; created_at: string };

export default async function GossipAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  const { status = "published" } = await searchParams;
  const svc = createServiceClient();
  let req = svc.from("gossip_posts").select("id, alias, body, status, created_at").order("created_at", { ascending: false }).limit(40);
  if (status !== "all") req = req.eq("status", status === "removed" ? "removed" : "published");
  const { data } = await req;
  const list = (data ?? []) as G[];
  const { data: reps } = list.length ? await svc.from("content_reports").select("target_id").eq("target_type", "gossip").in("target_id", list.map((g) => g.id)) : { data: [] };
  const reportCount = new Map<string, number>();
  (reps ?? []).forEach((r: { target_id: string }) => reportCount.set(r.target_id, (reportCount.get(r.target_id) ?? 0) + 1));

  return (
    <>
      <h1 className="text-2xl font-extrabold">Gossip</h1>
      <p className="mt-1 text-sm text-muted">Posts are anonymous to members. Authors are not listed here. Administrators can view an author from a post&apos;s page when acting on a report, and every view is written to the audit log.</p>
      <nav aria-label="Status" className="mt-4 flex gap-2">
        {["published", "removed", "all"].map((s) => <Link key={s} href={`/gossip?status=${s}`} aria-current={status === s ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{s}</Link>)}
      </nav>
      {list.length === 0 && <p className="mt-10 text-center text-muted">Nothing here.</p>}
      <ul className="mt-5 space-y-3">
        {list.map((g) => (
          <li key={g.id} className="card p-4">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <strong>{g.alias ?? "Anonymous"}</strong><span className="text-muted">{new Date(g.created_at).toLocaleString("en-KE")}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${g.status === "published" ? "bg-brand-tint text-brand-deep" : "bg-red-50 text-red-700"}`}>{g.status}</span>
              {(reportCount.get(g.id) ?? 0) > 0 && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">{reportCount.get(g.id)} report(s)</span>}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{g.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={setGossipStatus}>
                <input type="hidden" name="gossipId" value={g.id} />
                {g.status === "published" ? <button name="action" value="remove" className="btn btn-secondary !min-h-[40px]">Remove</button>
                  : isAdmin && <button name="action" value="restore" className="btn btn-secondary !min-h-[40px]">Restore</button>}
              </form>
              <Link href={`/gossip/${g.id}`} className="btn btn-secondary !min-h-[40px]">Details</Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
