import { requireStaff, MODERATION, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { setUserStatus } from "@/lib/admin-actions";

export const metadata = { title: "Users" };

type P = { id: string; username: string; display_name: string; status: string; created_at: string };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 50).replace(/[\\%_]/g, (c) => `\\${c}`);

  const svc = createServiceClient();
  let list: P[] = [];
  if (query.length >= 2) {
    const { data } = await svc.from("profiles").select("id, username, display_name, status, created_at").ilike("username", `%${query}%`).order("username").limit(20);
    list = (data ?? []) as P[];
  }
  const { data: roles } = list.length ? await svc.from("admin_roles").select("user_id").in("user_id", list.map((p) => p.id)) : { data: [] };
  const staffIds = new Set((roles ?? []).map((r: { user_id: string }) => r.user_id));

  return (
    <>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-muted">Search by username. Suspending hides a person&apos;s content and stops them posting. Private messages are not accessible from this tool.</p>
      <form role="search" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">Username</label>
        <input id="q" name="q" defaultValue={q} placeholder="username" className="field" autoComplete="off" />
        <button className="btn btn-primary">Search</button>
      </form>
      <ul className="mt-6 space-y-3">
        {list.map((p) => (
          <li key={p.id} className="rounded-xl border border-line p-4 dark:border-white/10">
            <p className="font-semibold">{p.display_name} <span className="font-normal text-muted">@{p.username}</span></p>
            <p className="text-sm text-muted">Status: {p.status.replace("_", " ")} · joined {new Date(p.created_at).toLocaleDateString("en-KE")}{staffIds.has(p.id) ? " · staff account" : ""}</p>
            {!staffIds.has(p.id) && p.id !== staff.id && (
              <form action={setUserStatus} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="userId" value={p.id} />
                <label htmlFor={`n-${p.id}`} className="sr-only">Reason</label>
                <input id={`n-${p.id}`} name="note" maxLength={500} placeholder="Reason (recorded)" className="field !w-auto min-w-[200px] flex-1" />
                {p.status !== "suspended" && <button name="action" value="suspend" className="btn btn-secondary !min-h-[40px]">Suspend</button>}
                {p.status === "suspended" && isAdmin && <button name="action" value="reinstate" className="btn btn-secondary !min-h-[40px]">Reinstate</button>}
              </form>
            )}
          </li>
        ))}
      </ul>
      {query.length >= 2 && list.length === 0 && <p className="mt-6 text-muted">No users found.</p>}
    </>
  );
}
