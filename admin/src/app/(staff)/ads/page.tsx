import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { reviewAd } from "@/lib/admin-actions";
import Link from "next/link";

export const metadata = { title: "Ads" };

type A = { id: string; business_name: string; title: string; body: string; link_url: string; placement: string; contact: string; status: string; clicks: number; views: number; image_path: string | null; created_at: string; ends_at: string | null };

export default async function AdsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff(MODERATION);
  const { status = "pending" } = await searchParams;
  const svc = createServiceClient();
  let q = svc.from("ads").select("id, business_name, title, body, link_url, placement, contact, status, clicks, views, image_path, created_at, ends_at").order("created_at", { ascending: false }).limit(50);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const list = (data ?? []) as A[];
  const btn = "rounded-full px-4 py-2 text-sm font-semibold";
  return (
    <>
      <h1 className="text-2xl font-extrabold">Ads</h1>
      <p className="mt-1 text-sm text-muted">Review applications. Approved ads run for the chosen days and always show as &ldquo;Sponsored&rdquo;. Open the link and check it before approving.</p>
      <nav className="mt-4 flex flex-wrap gap-2">{["pending", "approved", "paused", "rejected", "ended", "all"].map((s) => <Link key={s} href={`/ads?status=${s}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{s}</Link>)}</nav>
      {list.length === 0 && <p className="mt-10 text-center text-muted">Nothing here.</p>}
      <ul className="mt-5 space-y-3">
        {list.map((a) => (
          <li key={a.id} className="card p-4">
            <p className="font-bold">{a.title} <span className="text-sm font-normal text-muted">· {a.business_name} · {a.placement} · {a.status}</span></p>
            <p className="mt-1 text-sm">{a.body}</p>
            <p className="mt-1 break-all text-xs text-muted">Link: {a.link_url} · Contact: {a.contact} · {a.views} views · {a.clicks} taps{a.ends_at ? ` · ends ${new Date(a.ends_at).toLocaleDateString("en-KE")}` : ""}</p>
            <form action={reviewAd} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="adId" value={a.id} />
              <input name="note" placeholder="Note to advertiser (optional)" maxLength={500} className="field !min-h-[40px] min-w-[180px] flex-1" />
              <input name="days" type="number" min={1} max={365} defaultValue={30} aria-label="Days to run" className="field !min-h-[40px] w-20" />
              {a.status === "pending" && <><button name="action" value="approve" className={`${btn} bg-brand-dark text-white`}>Approve</button><button name="action" value="reject" className={`${btn} bg-red-50 text-red-700`}>Reject</button></>}
              {a.status === "approved" && <><button name="action" value="pause" className={`${btn} bg-surface`}>Pause</button><button name="action" value="end" className={`${btn} bg-red-50 text-red-700`}>End</button></>}
              {a.status === "paused" && <><button name="action" value="resume" className={`${btn} bg-brand-dark text-white`}>Resume</button><button name="action" value="end" className={`${btn} bg-red-50 text-red-700`}>End</button></>}
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
