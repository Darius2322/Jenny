import Link from "next/link";
import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";

export const metadata = { title: "Users" };

type P = { id: string; username: string; display_name: string; status: string; created_at: string };
const STATUSES = ["all", "active", "suspended", "deletion_requested"] as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireStaff(MODERATION);
  const { q = "", status = "all" } = await searchParams;
  const query = q.trim().slice(0, 50).replace(/[\\%_,()]/g, (c) => `\\${c}`);
  const svc = createServiceClient();
  let req = svc.from("profiles").select("id, username, display_name, status, created_at").order("created_at", { ascending: false }).limit(40);
  if (query.length >= 2) req = req.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
  if (status !== "all" && STATUSES.includes(status as (typeof STATUSES)[number])) req = req.eq("status", status);
  const { data } = await req;
  const list = (data ?? []) as P[];
  const { data: roles } = list.length ? await svc.from("admin_roles").select("user_id, role").in("user_id", list.map((p) => p.id)) : { data: [] };
  const staffRole = new Map((roles ?? []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));

  return (
    <>
      <h1 className="text-2xl font-extrabold">Users</h1>
      <p className="mt-1 text-sm text-muted">Search by name or username. Open a person to see their activity and take action. Private messages are not accessible.</p>
      <form role="search" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">Name or username</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search name or username" className="field" autoComplete="off" />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button className="btn btn-primary">Search</button>
      </form>
      <nav aria-label="Status filter" className="mt-3 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/users?${new URLSearchParams({ ...(q ? { q } : {}), status: s }).toString()}`} aria-current={status === s ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{s.replace("_", " ")}</Link>
        ))}
      </nav>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line text-muted dark:border-white/10"><th className="px-4 py-3">Person</th><th>Status</th><th>Joined</th><th className="pr-4">Role</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 dark:border-white/10">
                <td className="px-4 py-3"><Link href={`/users/${p.id}`} className="font-semibold hover:underline">{p.display_name}</Link> <span className="text-muted">@{p.username}</span></td>
                <td><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-brand-tint text-brand-deep" : "bg-red-50 text-red-700"}`}>{p.status.replace("_", " ")}</span></td>
                <td className="whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en-KE")}</td>
                <td className="pr-4 capitalize text-muted">{staffRole.get(p.id)?.replace("_", " ") ?? "member"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-muted">No users found.</p>}
      </div>
    </>
  );
}
