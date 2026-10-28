import { requireStaff } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { addStaff, removeStaff } from "@/lib/admin-actions";
import { ADMINS } from "@/lib/staff";

export const metadata = { title: "Staff" };

const DESC: Record<string, string> = {
  system_owner: "Full control, including staff roles.",
  administrator: "Everything except staff roles: deletions, reinstating, verification badges, audit log.",
  moderator: "Reports, posts, gossip, businesses, news, suspending users.",
  support: "Read-only overview.",
};

export default async function StaffPage() {
  const me = await requireStaff(ADMINS);
  const owner = me.role === "system_owner";
  const svc = createServiceClient();
  const { data: roles } = await svc.from("admin_roles").select("user_id, role").order("role");
  const rows = (roles ?? []) as { user_id: string; role: string }[];
  const names = new Map<string, string>();
  if (rows.length) (await svc.from("profiles").select("id, username, display_name").in("id", rows.map((r) => r.user_id))).data?.forEach((p: { id: string; username: string; display_name: string }) => names.set(p.id, `${p.display_name} (@${p.username})`));

  return (
    <>
      <h1 className="text-2xl font-extrabold">Staff</h1>
      <p className="mt-1 text-sm text-muted">Everyone with access to this portal. Staff must also complete two-factor sign-in.</p>
      <ul className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.user_id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div><p className="font-semibold">{names.get(r.user_id) ?? r.user_id.slice(0, 8)}{r.user_id === me.id ? " (you)" : ""}</p><p className="text-sm text-muted"><span className="font-semibold capitalize">{r.role.replace("_", " ")}</span>: {DESC[r.role]}</p></div>
            {owner && r.role !== "system_owner" && r.user_id !== me.id && (
              <form action={removeStaff}><input type="hidden" name="userId" value={r.user_id} /><button className="btn btn-secondary !min-h-[40px]">Remove access</button></form>
            )}
          </li>
        ))}
      </ul>
      {owner ? (
        <section className="card mt-6 p-5">
          <h2 className="font-bold">Add or change a staff member</h2>
          <form action={addStaff} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="sr-only" htmlFor="username">Username</label>
            <input id="username" name="username" required placeholder="Member's username" className="field" autoComplete="off" />
            <label className="sr-only" htmlFor="role">Role</label>
            <select id="role" name="role" className="field"><option value="moderator">Moderator</option><option value="administrator">Administrator</option><option value="support">Support</option></select>
            <button className="btn btn-primary">Save</button>
          </form>
          <p className="mt-2 text-xs text-muted">The person must already have a Jenny account. They will be asked to set up two-factor sign-in on first use. Every change is audited.</p>
        </section>
      ) : <p className="mt-6 text-sm text-muted">Only the system owner can change staff roles.</p>}
    </>
  );
}
