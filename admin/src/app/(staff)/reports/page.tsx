import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { resolveReport } from "@/lib/admin-actions";

export const metadata = { title: "Reports" };

type Report = { id: string; reporter_id: string; target_type: string; target_id: string; reason: string; details: string | null; status: string; created_at: string };

export default async function ReportsPage() {
  const staff = await requireStaff(MODERATION);
  const svc = createServiceClient();
  const { data } = await svc.from("content_reports").select("id, reporter_id, target_type, target_id, reason, details, status, created_at")
    .in("status", ["open", "reviewing"]).order("created_at", { ascending: true }).limit(50);
  const reports = (data ?? []) as Report[];

  const ids = (type: string) => reports.filter((r) => r.target_type === type).map((r) => r.target_id);
  const [posts, comments, profiles, businesses] = await Promise.all([
    ids("post").length ? svc.from("posts").select("id, body, author_id, status").in("id", ids("post")) : { data: [] },
    ids("comment").length ? svc.from("comments").select("id, body, author_id, status").in("id", ids("comment")) : { data: [] },
    ids("profile").length ? svc.from("profiles").select("id, username, display_name, status").in("id", ids("profile")) : { data: [] },
    ids("business").length ? svc.from("businesses").select("id, name, handle, status").in("id", ids("business")) : { data: [] },
  ]);
  const preview = new Map<string, string>();
  (posts.data ?? []).forEach((p: { id: string; body: string; status: string }) => preview.set(`post:${p.id}`, `“${p.body.slice(0, 280)}” [${p.status}]`));
  (comments.data ?? []).forEach((c: { id: string; body: string; status: string }) => preview.set(`comment:${c.id}`, `“${c.body.slice(0, 280)}” [${c.status}]`));
  (profiles.data ?? []).forEach((p: { id: string; username: string; display_name: string; status: string }) => preview.set(`profile:${p.id}`, `${p.display_name} (@${p.username}) [${p.status}]`));
  (businesses.data ?? []).forEach((b: { id: string; name: string; handle: string; status: string }) => preview.set(`business:${b.id}`, `${b.name} (@${b.handle}) [${b.status}]`));

  return (
    <>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="mt-1 text-sm text-muted">Oldest first. Signed in as {staff.role.replace("_", " ")}. Every decision is recorded.</p>
      {reports.length === 0 && <p className="mt-8 text-muted">No open reports.</p>}
      <ul className="mt-6 space-y-4">
        {reports.map((r) => {
          const canHide = r.target_type === "post" || r.target_type === "comment";
          return (
            <li key={r.id} className="rounded-xl border border-line p-4 dark:border-white/10">
              <p className="text-sm"><span className="font-semibold capitalize">{r.target_type}</span> · reason: <strong>{r.reason.replace("_", " ")}</strong> · {new Date(r.created_at).toLocaleString("en-KE")}</p>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-surface p-3 text-sm dark:bg-white/10">{preview.get(`${r.target_type}:${r.target_id}`) ?? "Content no longer exists."}</p>
              {r.details && <p className="mt-2 text-sm text-muted">Reporter note: {r.details}</p>}
              <form action={resolveReport} className="mt-3 space-y-2">
                <input type="hidden" name="reportId" value={r.id} />
                <label htmlFor={`n-${r.id}`} className="sr-only">Internal note</label>
                <input id={`n-${r.id}`} name="note" maxLength={500} placeholder="Internal note (optional)" className="field" />
                <div className="flex flex-wrap gap-2">
                  {canHide && <button name="action" value="hide" className="btn btn-secondary !min-h-[40px]">Hide content</button>}
                  {canHide && <button name="action" value="remove" className="btn btn-secondary !min-h-[40px]">Remove content</button>}
                  {!canHide && <button name="action" value="mark_actioned" className="btn btn-secondary !min-h-[40px]">Mark actioned</button>}
                  <button name="action" value="dismiss" className="btn btn-secondary !min-h-[40px]">Dismiss</button>
                </div>
              </form>
              {!canHide && <p className="mt-2 text-xs text-muted">For profiles and businesses, act on the Users or Businesses page first, then mark the report actioned.</p>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
