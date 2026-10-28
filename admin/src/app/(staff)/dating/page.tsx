import Link from "next/link";
import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";

export const metadata = { title: "Dating" };

export default async function DatingAdmin() {
  await requireStaff(MODERATION);
  const svc = createServiceClient();
  const head = { count: "exact" as const, head: true };
  const week = new Date(Date.now() - 7 * 86400000).toISOString();
  const [total, active, newWeek, likes, reports, openReports] = await Promise.all([
    svc.from("dating_profiles").select("user_id", head),
    svc.from("dating_profiles").select("user_id", head).eq("active", true),
    svc.from("dating_profiles").select("user_id", head).gte("created_at", week),
    svc.from("dating_swipes").select("from_user", head).eq("liked", true),
    svc.from("content_reports").select("id", head).eq("target_type", "profile"),
    svc.from("content_reports").select("id", head).eq("target_type", "profile").in("status", ["open", "reviewing"]),
  ]);
  const cards = [
    ["Dating profiles", total.count], ["Visible (not paused)", active.count], ["New this week", newWeek.count], ["Likes sent", likes.count],
    ["Profile reports (all time)", reports.count], ["Profile reports open", openReports.count],
  ] as const;
  return (
    <>
      <h1 className="text-2xl font-extrabold">Dating</h1>
      <p className="mt-1 text-sm text-muted">Aggregate figures only. Dates of birth, likes and who matched with whom are not shown to staff. Everyone in dating is verified 18+ by self-declaration and a database rule.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map(([l, n]) => <li key={l} className="card p-4"><p className="text-3xl font-extrabold">{n ?? 0}</p><p className="mt-1 text-sm text-muted">{l}</p></li>)}
      </ul>
      <section className="card mt-6 p-5">
        <h2 className="font-bold">Handling dating reports</h2>
        <p className="mt-2 text-sm text-muted">People report dating profiles from their card. These arrive as profile reports. Open the report, review the person on the Users page, and suspend the account if needed. Suspended accounts disappear from dating automatically.</p>
        <Link href="/reports?type=profile" className="btn btn-secondary mt-3 !min-h-[44px]">Open profile reports</Link>
      </section>
    </>
  );
}
