import { requireStaff, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { processDeletion } from "@/lib/admin-actions";

export const metadata = { title: "Deletion requests" };

type Req = { id: string; user_id: string; reason: string | null; requested_at: string };

export default async function DeletionsPage() {
  await requireStaff(ADMINS);
  const svc = createServiceClient();
  const { data } = await svc.from("account_deletion_requests").select("id, user_id, reason, requested_at").eq("status", "requested").order("requested_at", { ascending: true }).limit(50);
  const reqs = (data ?? []) as Req[];
  const ids = reqs.map((r) => r.user_id);

  const [{ data: profiles }, { data: roles }, { data: biz }] = ids.length
    ? await Promise.all([
        svc.from("profiles").select("id, username, display_name").in("id", ids),
        svc.from("admin_roles").select("user_id").in("user_id", ids),
        svc.from("businesses").select("created_by").in("created_by", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const names = new Map((profiles ?? []).map((p: { id: string; username: string; display_name: string }) => [p.id, p] as const));
  const staffIds = new Set((roles ?? []).map((r: { user_id: string }) => r.user_id));
  const ownerIds = new Set((biz ?? []).map((b: { created_by: string }) => b.created_by));

  return (
    <>
      <h1 className="text-2xl font-bold">Deletion requests</h1>
      <p className="mt-1 text-sm text-muted">People who asked us to delete their account. Deleting is permanent: their profile, posts, comments, messages and uploaded photos are removed. Each deletion is written to the audit log.</p>
      {reqs.length === 0 && <p className="mt-6 text-muted">No open requests.</p>}
      <ul className="mt-6 space-y-3">
        {reqs.map((r) => {
          const p = names.get(r.user_id);
          const blocked = staffIds.has(r.user_id) ? "This is a staff account. Remove the staff role first." : ownerIds.has(r.user_id) ? "This person owns a business. Delete or reassign the business first." : null;
          return (
            <li key={r.id} className="rounded-xl border border-line p-4 dark:border-white/10">
              <p className="font-semibold">{p?.display_name ?? "Unknown"} <span className="font-normal text-muted">@{p?.username ?? "unknown"}</span></p>
              <p className="text-sm text-muted">Requested {new Date(r.requested_at).toLocaleDateString("en-KE")}</p>
              {r.reason && <p className="mt-1 whitespace-pre-wrap break-words text-sm">Reason: {r.reason}</p>}
              {blocked ? (
                <p role="status" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{blocked}</p>
              ) : p ? (
                <form action={processDeletion} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="userId" value={r.user_id} />
                  <label htmlFor={`c-${r.id}`} className="sr-only">Type the username to confirm</label>
                  <input id={`c-${r.id}`} name="confirm" required autoComplete="off" autoCapitalize="none" placeholder={`Type ${p.username} to confirm`} className="field !w-auto min-w-[200px] flex-1" />
                  <button type="submit" className="btn btn-secondary !min-h-[40px]">Delete permanently</button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
