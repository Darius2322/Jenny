import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";

export const metadata = { title: "Overview" };

export default async function Overview() {
  await requireStaff();
  const svc = createServiceClient();
  const since = new Date(Date.now() - 86400000).toISOString();
  const head = { count: "exact" as const, head: true };
  const [reports, bizPending, newsPending, users, posts24, deletion] = await Promise.all([
    svc.from("content_reports").select("id", head).in("status", ["open", "reviewing"]),
    svc.from("businesses").select("id", head).eq("status", "pending_review"),
    svc.from("news_submissions").select("id", head).eq("status", "pending"),
    svc.from("profiles").select("id", head),
    svc.from("posts").select("id", head).gte("created_at", since),
    svc.from("account_deletion_requests").select("id", head).eq("status", "requested"),
  ]);
  const cards = [
    { label: "Open reports", n: reports.count, href: "/reports" },
    { label: "Businesses awaiting review", n: bizPending.count, href: "/businesses" },
    { label: "News awaiting review", n: newsPending.count, href: "/news" },
    { label: "Registered users", n: users.count, href: "/users" },
    { label: "Posts in the last 24 hours", n: posts24.count, href: null },
    { label: "Deletion requests (not yet handled here)", n: deletion.count, href: null },
  ];
  return (
    <>
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-muted">Figures come straight from the database.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label} className="rounded-xl border border-line p-4 dark:border-white/10">
            <p className="text-3xl font-extrabold">{c.n ?? "–"}</p>
            <p className="mt-1 text-sm text-muted">{c.label}</p>
            {c.href && <Link href={c.href} className="mt-2 inline-block text-sm font-semibold text-brand-dark underline dark:text-brand">Open</Link>}
          </li>
        ))}
      </ul>
    </>
  );
}
