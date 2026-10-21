import { requireStaff, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";

export const metadata = { title: "Audit log" };

type L = { id: number; actor_id: string | null; action: string; target_type: string | null; target_id: string | null; metadata: Record<string, unknown>; created_at: string };

export default async function AuditPage() {
  await requireStaff(ADMINS);
  const svc = createServiceClient();
  const { data } = await svc.from("admin_audit_logs").select("id, actor_id, action, target_type, target_id, metadata, created_at").order("created_at", { ascending: false }).limit(100);
  const logs = (data ?? []) as L[];
  const actorIds = [...new Set(logs.map((l) => l.actor_id).filter((x): x is string => !!x))];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: ps } = await svc.from("profiles").select("id, username").in("id", actorIds);
    (ps ?? []).forEach((p: { id: string; username: string }) => names.set(p.id, p.username));
  }
  return (
    <>
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-muted">Latest 100 privileged actions. This log is append-only: the database rejects edits and deletions.</p>
      {logs.length === 0 && <p className="mt-8 text-muted">No actions recorded yet.</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line text-muted dark:border-white/10"><th className="py-2 pr-4">When</th><th className="pr-4">Who</th><th className="pr-4">Action</th><th>Target</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-line align-top dark:border-white/10">
                <td className="py-2 pr-4 whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-KE")}</td>
                <td className="pr-4">{l.actor_id ? `@${names.get(l.actor_id) ?? l.actor_id.slice(0, 8)}` : "system"}</td>
                <td className="pr-4 font-medium">{l.action}</td>
                <td className="break-all text-muted">{l.target_type}{l.target_id ? ` ${l.target_id.slice(0, 8)}…` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
