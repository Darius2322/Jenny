import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff, audit, MODERATION, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { setGossipStatus } from "@/lib/admin-actions";

export const metadata = { title: "Gossip post" };

export default async function GossipDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reveal?: string }> }) {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  const { id } = await params;
  const { reveal } = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const svc = createServiceClient();
  const { data: g } = await svc.from("gossip_posts").select("id, author_id, alias, body, status, created_at, reply_to").eq("id", id).maybeSingle();
  if (!g) notFound();
  const { data: reports } = await svc.from("content_reports").select("id, reason, status, created_at").eq("target_type", "gossip").eq("target_id", id).order("created_at", { ascending: false });

  // Author is shown only to administrators, only on request, and only when this post has been reported.
  // Every display writes an audit entry, so the lookup can't happen silently.
  let author: { id: string; username: string; display_name: string } | null = null;
  const canReveal = isAdmin && (reports ?? []).length > 0;
  if (reveal === "1" && canReveal) {
    author = (await svc.from("profiles").select("id, username, display_name").eq("id", g.author_id).maybeSingle()).data;
    await audit(staff.id, "gossip.reveal_author", "gossip", id);
  }

  return (
    <>
      <Link href="/gossip" className="text-sm font-semibold text-brand-dark underline dark:text-brand">← All gossip</Link>
      <h1 className="mt-3 text-2xl font-extrabold">Gossip post</h1>
      <p className="mt-1 text-sm text-muted">{new Date(g.created_at).toLocaleString("en-KE")} · {g.status} · aka {g.alias ?? "none (Anonymous)"}</p>
      <section className="card mt-5 p-5"><p className="whitespace-pre-wrap break-words">{g.body}</p></section>

      <section className="card mt-5 p-5">
        <h2 className="font-bold">Reports ({(reports ?? []).length})</h2>
        <ul className="mt-2 divide-y divide-line text-sm dark:divide-white/10">
          {(reports ?? []).length === 0 && <li className="py-2 text-muted">None.</li>}
          {(reports ?? []).map((r: { id: string; reason: string; status: string; created_at: string }) => <li key={r.id}><Link href={`/reports/${r.id}`} className="flex min-h-[44px] items-center justify-between hover:underline"><span className="capitalize">{r.reason.replace("_", " ")}</span><span className="text-muted">{r.status}</span></Link></li>)}
        </ul>
      </section>

      <section className="card mt-5 p-5">
        <h2 className="font-bold">Author</h2>
        {author ? (
          <p className="mt-2 text-sm">This post was written by <Link href={`/users/${author.id}`} className="font-semibold underline">{author.display_name} (@{author.username})</Link>. This view was logged.</p>
        ) : canReveal ? (
          <>
            <p className="mt-2 text-sm text-muted">Only reveal the author to act on a report. The reveal is logged with your name.</p>
            <Link href={`/gossip/${id}?reveal=1`} className="btn btn-secondary mt-3 !min-h-[44px]">Reveal author (logged)</Link>
          </>
        ) : <p className="mt-2 text-sm text-muted">{isAdmin ? "The author can only be revealed once the post has been reported." : "Only administrators can view an author, and only for reported posts."}</p>}
      </section>

      <form action={setGossipStatus} className="mt-5 flex gap-2">
        <input type="hidden" name="gossipId" value={id} />
        {g.status === "published" ? <button name="action" value="remove" className="btn btn-primary !min-h-[44px]">Remove this gossip</button>
          : isAdmin && <button name="action" value="restore" className="btn btn-primary !min-h-[44px]">Restore</button>}
      </form>
    </>
  );
}
