import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { loadTargets } from "@/lib/preview";
import { resolveReport } from "@/lib/admin-actions";

export const metadata = { title: "Report" };
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-KE") : "–");

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff(MODERATION);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const svc = createServiceClient();
  const { data: r } = await svc.from("content_reports").select("id, reporter_id, target_type, target_id, reason, details, status, created_at, resolved_at, assigned_to").eq("id", id).maybeSingle();
  if (!r) notFound();

  const [targets, reporter, siblings, actions, assignee] = await Promise.all([
    loadTargets([r]),
    svc.from("profiles").select("id, username, display_name").eq("id", r.reporter_id).maybeSingle(),
    svc.from("content_reports").select("id, reason, status, created_at").eq("target_type", r.target_type).eq("target_id", r.target_id).neq("id", r.id).order("created_at", { ascending: false }).limit(10),
    svc.from("moderation_actions").select("id, action, note, created_at, moderator_id").eq("target_id", r.target_id).order("created_at", { ascending: false }).limit(10),
    r.assigned_to ? svc.from("profiles").select("username").eq("id", r.assigned_to).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const t = targets.get(`${r.target_type}:${r.target_id}`);
  const author = t?.authorId ? (await svc.from("profiles").select("id, username, display_name").eq("id", t.authorId).maybeSingle()).data : null;
  const open = r.status === "open" || r.status === "reviewing";
  const canHide = ["post", "comment", "gossip"].includes(r.target_type);

  return (
    <>
      <Link href="/reports" className="text-sm font-semibold text-brand-dark underline dark:text-brand">← All reports</Link>
      <h1 className="mt-3 text-2xl font-extrabold capitalize">{r.target_type} report: {r.reason.replace("_", " ")}</h1>
      <p className="mt-1 text-sm text-muted">Filed {when(r.created_at)} · status <strong>{r.status}</strong>{r.resolved_at ? ` · resolved ${when(r.resolved_at)}` : ""}{assignee.data ? ` by @${assignee.data.username}` : ""}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="font-bold">Reported content</h2>
          <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface p-4 dark:bg-white/10">{t ? t.text : "This content no longer exists."}</p>
          {t?.status && <p className="mt-2 text-sm text-muted">Current state: <strong>{t.status}</strong></p>}
          {author && <p className="mt-2 text-sm">Author: <Link href={`/users/${author.id}`} className="font-semibold underline">{author.display_name} (@{author.username})</Link></p>}
          {r.target_type === "gossip" && <p className="mt-2 text-sm text-muted">Gossip is anonymous. Administrators can view an author from the <Link href={`/gossip/${r.target_id}`} className="underline">gossip page</Link>; that is logged.</p>}
          {r.target_type === "profile" && t?.href && <Link href={t.href} className="mt-2 inline-block text-sm font-semibold underline">Open this person&apos;s page</Link>}
          {r.details && <p className="mt-4 text-sm"><strong>Reporter&apos;s note:</strong> {r.details}</p>}
          <p className="mt-4 text-sm text-muted">Reported by {reporter.data ? <Link href={`/users/${reporter.data.id}`} className="underline">@{reporter.data.username}</Link> : "a deleted account"}</p>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Decision</h2>
          {open ? (
            <form action={resolveReport} className="mt-3 space-y-3">
              <input type="hidden" name="reportId" value={r.id} />
              <label htmlFor="note" className="label">Internal note (optional)</label>
              <input id="note" name="note" maxLength={500} className="field" />
              <div className="flex flex-col gap-2">
                {canHide && r.target_type !== "gossip" && <button name="action" value="hide" className="btn btn-secondary !min-h-[44px]">Hide content</button>}
                {canHide && <button name="action" value="remove" className="btn btn-secondary !min-h-[44px]">Remove content</button>}
                {!canHide && <button name="action" value="mark_actioned" className="btn btn-secondary !min-h-[44px]">Mark actioned</button>}
                <button name="action" value="dismiss" className="btn btn-primary !min-h-[44px]">Dismiss report</button>
              </div>
              {!canHide && <p className="text-xs text-muted">Act on the person or business first, then mark the report actioned.</p>}
            </form>
          ) : <p className="mt-3 text-sm text-muted">This report has been resolved.</p>}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="font-bold">Other reports on this</h2>
          <ul className="mt-2 divide-y divide-line text-sm dark:divide-white/10">
            {(siblings.data ?? []).length === 0 && <li className="py-2 text-muted">None.</li>}
            {(siblings.data ?? []).map((s: { id: string; reason: string; status: string; created_at: string }) => <li key={s.id}><Link href={`/reports/${s.id}`} className="flex min-h-[44px] items-center justify-between hover:underline"><span className="capitalize">{s.reason.replace("_", " ")}</span><span className="text-muted">{s.status}</span></Link></li>)}
          </ul></section>
        <section className="card p-5"><h2 className="font-bold">Moderation history</h2>
          <ul className="mt-2 divide-y divide-line text-sm dark:divide-white/10">
            {(actions.data ?? []).length === 0 && <li className="py-2 text-muted">No actions.</li>}
            {(actions.data ?? []).map((a: { id: number; action: string; note: string | null; created_at: string }) => <li key={a.id} className="py-2"><strong>{a.action.replace("_", " ")}</strong> · {when(a.created_at)}{a.note ? <span className="block text-muted">{a.note}</span> : null}</li>)}
          </ul></section>
      </div>
    </>
  );
}
