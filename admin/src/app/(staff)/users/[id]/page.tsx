import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff, MODERATION, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { setUserStatus } from "@/lib/admin-actions";

export const metadata = { title: "User" };

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-KE") : "never");

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("id, username, display_name, bio, location_text, website, visibility, discoverable, status, created_at").eq("id", id).maybeSingle();
  if (!p) notFound();

  const head = { count: "exact" as const, head: true };
  const [auth, role, posts, comments, followers, following, against, filed, biz, dating, recent, actions, reportsAgainst] = await Promise.all([
    isAdmin ? svc.auth.admin.getUserById(id) : Promise.resolve(null),
    svc.from("admin_roles").select("role").eq("user_id", id).maybeSingle(),
    svc.from("posts").select("id", head).eq("author_id", id),
    svc.from("comments").select("id", head).eq("author_id", id),
    svc.from("follows").select("follower_id", head).eq("followee_id", id).eq("status", "accepted"),
    svc.from("follows").select("followee_id", head).eq("follower_id", id).eq("status", "accepted"),
    svc.from("content_reports").select("id", head).eq("target_type", "profile").eq("target_id", id),
    svc.from("content_reports").select("id", head).eq("reporter_id", id),
    svc.from("businesses").select("id, name, status").eq("created_by", id),
    svc.from("dating_profiles").select("active").eq("user_id", id).maybeSingle(),
    svc.from("posts").select("id, body, status, created_at").eq("author_id", id).order("created_at", { ascending: false }).limit(8),
    svc.from("moderation_actions").select("id, action, note, created_at").eq("target_id", id).order("created_at", { ascending: false }).limit(10),
    svc.from("content_reports").select("id, reason, status, created_at").eq("target_type", "profile").eq("target_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  const isStaffTarget = !!role.data;
  const stats = [["Posts", posts.count], ["Comments", comments.count], ["Followers", followers.count], ["Following", following.count], ["Reports against", against.count], ["Reports filed", filed.count]];

  return (
    <>
      <Link href="/users" className="text-sm font-semibold text-brand-dark underline dark:text-brand">← All users</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{p.display_name}</h1>
          <p className="text-muted">@{p.username}{isStaffTarget ? ` · staff (${String(role.data?.role).replace("_", " ")})` : ""}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.status === "active" ? "bg-brand-tint text-brand-deep" : "bg-red-50 text-red-700"}`}>{String(p.status).replace("_", " ")}</span>
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-3 lg:grid-cols-6">
        {stats.map(([l, n]) => <li key={String(l)} className="card p-3 text-center"><p className="text-2xl font-extrabold">{n ?? 0}</p><p className="text-xs text-muted">{l}</p></li>)}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Joined</dt><dd>{when(p.created_at)}</dd></div>
            {isAdmin && <div className="flex justify-between gap-4"><dt className="text-muted">Email</dt><dd className="break-all">{auth?.data?.user?.email ?? "–"}</dd></div>}
            {isAdmin && <div className="flex justify-between gap-4"><dt className="text-muted">Last sign-in</dt><dd>{when(auth?.data?.user?.last_sign_in_at)}</dd></div>}
            {isAdmin && <div className="flex justify-between gap-4"><dt className="text-muted">Email verified</dt><dd>{auth?.data?.user?.email_confirmed_at ? "Yes" : "No"}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted">Profile visibility</dt><dd>{p.visibility}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Listed in search</dt><dd>{p.discoverable ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Dating</dt><dd>{dating.data ? (dating.data.active ? "Opted in, visible" : "Opted in, paused") : "Not opted in"}</dd></div>
            {p.location_text && <div className="flex justify-between gap-4"><dt className="text-muted">Location</dt><dd>{p.location_text}</dd></div>}
          </dl>
          {p.bio && <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface p-3 text-sm dark:bg-white/10">{p.bio}</p>}
          {(biz.data ?? []).length > 0 && <p className="mt-3 text-sm text-muted">Business: {(biz.data ?? []).map((b: { name: string; status: string }) => `${b.name} (${b.status})`).join(", ")}</p>}
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Action</h2>
          {isStaffTarget || p.id === staff.id ? <p className="mt-3 text-sm text-muted">Staff accounts, and your own, can&apos;t be changed from this screen.</p> : (
            <form action={setUserStatus} className="mt-3 space-y-3">
              <input type="hidden" name="userId" value={p.id} />
              <label htmlFor="note" className="label">Reason (recorded and shown to the person as a moderation notice)</label>
              <input id="note" name="note" maxLength={500} className="field" placeholder="e.g. repeated harassment" />
              <div className="flex flex-wrap gap-2">
                {p.status !== "suspended" && <button name="action" value="suspend" className="btn btn-primary !min-h-[44px]">Suspend account</button>}
                {p.status === "suspended" && isAdmin && <button name="action" value="reinstate" className="btn btn-primary !min-h-[44px]">Reinstate account</button>}
                {p.status === "suspended" && !isAdmin && <p className="text-sm text-muted">Only administrators can reinstate.</p>}
              </div>
            </form>
          )}
          <h3 className="mt-6 text-sm font-bold">Moderation history</h3>
          <ul className="mt-2 divide-y divide-line text-sm dark:divide-white/10">
            {(actions.data ?? []).length === 0 && <li className="py-2 text-muted">No actions taken.</li>}
            {(actions.data ?? []).map((a: { id: number; action: string; note: string | null; created_at: string }) => <li key={a.id} className="py-2"><strong>{a.action.replace("_", " ")}</strong> · {when(a.created_at)}{a.note ? <span className="block text-muted">{a.note}</span> : null}</li>)}
          </ul>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-bold">Reports against this person</h2>
        <ul className="mt-2 divide-y divide-line text-sm dark:divide-white/10">
          {(reportsAgainst.data ?? []).length === 0 && <li className="py-2 text-muted">None.</li>}
          {(reportsAgainst.data ?? []).map((r: { id: string; reason: string; status: string; created_at: string }) => <li key={r.id}><Link href={`/reports/${r.id}`} className="flex min-h-[44px] items-center justify-between hover:underline"><span className="capitalize">{r.reason.replace("_", " ")}</span><span className="text-muted">{r.status} · {when(r.created_at)}</span></Link></li>)}
        </ul>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="font-bold">Recent posts</h2>
        <ul className="mt-2 divide-y divide-line text-sm dark:divide-white/10">
          {(recent.data ?? []).length === 0 && <li className="py-2 text-muted">No posts.</li>}
          {(recent.data ?? []).map((x: { id: string; body: string; status: string; created_at: string }) => <li key={x.id} className="py-2"><p className="line-clamp-2 break-words">{x.body}</p><p className="text-xs text-muted">{x.status} · {when(x.created_at)}</p></li>)}
        </ul>
        <Link href={`/posts?author=${p.id}`} className="mt-2 inline-block text-sm font-semibold text-brand-dark underline dark:text-brand">Manage this person&apos;s posts</Link>
      </section>
    </>
  );
}
