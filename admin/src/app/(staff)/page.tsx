import Link from "next/link";
import { requireStaff, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";

export const metadata = { title: "Overview" };

const ago = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.floor(s / 60) || 1}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default async function Overview() {
  const staff = await requireStaff();
  const isAdmin = ADMINS.includes(staff.role);
  const svc = createServiceClient();
  const day = new Date(Date.now() - 86400000).toISOString();
  const week = new Date(Date.now() - 7 * 86400000).toISOString();
  const head = { count: "exact" as const, head: true };
  const [users, users24, users7, suspended, posts, posts24, comments, gossip, dating, datingActive, convs, msgs24, reports, reportsWeek, biz, bizPending, news, del, recentUsers, recentReports, recentAudit] = await Promise.all([
    svc.from("profiles").select("id", head),
    svc.from("profiles").select("id", head).gte("created_at", day),
    svc.from("profiles").select("id", head).gte("created_at", week),
    svc.from("profiles").select("id", head).eq("status", "suspended"),
    svc.from("posts").select("id", head).eq("status", "published"),
    svc.from("posts").select("id", head).gte("created_at", day),
    svc.from("comments").select("id", head).eq("status", "published"),
    svc.from("gossip_posts").select("id", head).eq("status", "published"),
    svc.from("dating_profiles").select("user_id", head),
    svc.from("dating_profiles").select("user_id", head).eq("active", true),
    svc.from("conversations").select("id", head),
    svc.from("messages").select("id", head).gte("created_at", day),
    svc.from("content_reports").select("id", head).in("status", ["open", "reviewing"]),
    svc.from("content_reports").select("id", head).gte("created_at", week),
    svc.from("businesses").select("id", head).eq("status", "active"),
    svc.from("businesses").select("id", head).eq("status", "pending_review"),
    svc.from("news_submissions").select("id", head).eq("status", "pending"),
    svc.from("account_deletion_requests").select("id", head).eq("status", "requested"),
    svc.from("profiles").select("id, username, display_name, created_at").order("created_at", { ascending: false }).limit(6),
    svc.from("content_reports").select("id, target_type, reason, status, created_at").order("created_at", { ascending: false }).limit(6),
    isAdmin ? svc.from("admin_audit_logs").select("id, action, created_at").order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [] }),
  ]);

  const groups: { title: string; cards: { label: string; n: number | null; sub?: string; href?: string; alert?: boolean }[] }[] = [
    { title: "Needs attention", cards: [
      { label: "Open reports", n: reports.count, href: "/reports", alert: (reports.count ?? 0) > 0 },
      { label: "Businesses to review", n: bizPending.count, href: "/businesses", alert: (bizPending.count ?? 0) > 0 },
      { label: "News to review", n: news.count, href: "/news", alert: (news.count ?? 0) > 0 },
      ...(isAdmin ? [{ label: "Deletion requests", n: del.count, href: "/deletions", alert: (del.count ?? 0) > 0 }] : []),
    ] },
    { title: "People", cards: [
      { label: "Registered users", n: users.count, href: "/users", sub: `${users24.count ?? 0} today · ${users7.count ?? 0} this week` },
      { label: "Suspended", n: suspended.count, href: "/users?status=suspended" },
      { label: "Dating profiles", n: dating.count, href: "/dating", sub: `${datingActive.count ?? 0} visible` },
    ] },
    { title: "Content & activity", cards: [
      { label: "Posts", n: posts.count, href: "/posts", sub: `${posts24.count ?? 0} in 24h` },
      { label: "Comments", n: comments.count },
      { label: "Gossip", n: gossip.count, href: "/gossip" },
      { label: "Conversations", n: convs.count, sub: `${msgs24.count ?? 0} messages in 24h` },
      { label: "Active businesses", n: biz.count, href: "/businesses" },
      { label: "Reports this week", n: reportsWeek.count },
    ] },
  ];

  return (
    <>
      <h1 className="text-2xl font-extrabold">Overview</h1>
      <p className="mt-1 text-sm text-muted">Live figures from the database. Private messages are never readable here.</p>
      {groups.map((g) => (
        <section key={g.title} className="mt-7">
          <h2 className="eyebrow">{g.title}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {g.cards.map((c) => {
              const body = (
                <>
                  <p className={`text-3xl font-extrabold ${c.alert ? "text-brand-dark dark:text-brand" : ""}`}>{c.n ?? "–"}</p>
                  <p className="mt-1 text-sm font-medium">{c.label}</p>
                  {c.sub && <p className="mt-0.5 text-xs text-muted">{c.sub}</p>}
                </>
              );
              return (
                <li key={c.label} className={`card p-4 ${c.alert ? "!border-brand" : ""}`}>
                  {c.href ? <Link href={c.href} className="block">{body}</Link> : body}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="card p-4"><h2 className="font-bold">Newest members</h2>
          <ul className="mt-3 divide-y divide-line dark:divide-white/10">
            {(recentUsers.data ?? []).map((u: { id: string; username: string; display_name: string; created_at: string }) => (
              <li key={u.id}><Link href={`/users/${u.id}`} className="flex min-h-[44px] items-center justify-between gap-2 text-sm hover:underline"><span className="truncate">{u.display_name} <span className="text-muted">@{u.username}</span></span><span className="shrink-0 text-xs text-muted">{ago(u.created_at)}</span></Link></li>
            ))}
          </ul></section>
        <section className="card p-4"><h2 className="font-bold">Latest reports</h2>
          <ul className="mt-3 divide-y divide-line dark:divide-white/10">
            {(recentReports.data ?? []).length === 0 && <li className="py-3 text-sm text-muted">None yet.</li>}
            {(recentReports.data ?? []).map((r: { id: string; target_type: string; reason: string; status: string; created_at: string }) => (
              <li key={r.id}><Link href={`/reports/${r.id}`} className="flex min-h-[44px] items-center justify-between gap-2 text-sm hover:underline"><span className="truncate capitalize">{r.target_type} · {r.reason.replace("_", " ")}</span><span className="shrink-0 text-xs text-muted">{r.status} · {ago(r.created_at)}</span></Link></li>
            ))}
          </ul></section>
        {isAdmin && (
          <section className="card p-4"><h2 className="font-bold">Recent staff actions</h2>
            <ul className="mt-3 divide-y divide-line dark:divide-white/10">
              {(recentAudit.data ?? []).length === 0 && <li className="py-3 text-sm text-muted">None yet.</li>}
              {(recentAudit.data ?? []).map((a: { id: number; action: string; created_at: string }) => (
                <li key={a.id} className="flex min-h-[44px] items-center justify-between gap-2 text-sm"><span className="truncate font-medium">{a.action}</span><span className="shrink-0 text-xs text-muted">{ago(a.created_at)}</span></li>
              ))}
            </ul><Link href="/audit" className="mt-2 inline-block text-sm font-semibold text-brand-dark underline dark:text-brand">Full audit log</Link></section>
        )}
      </div>
    </>
  );
}
