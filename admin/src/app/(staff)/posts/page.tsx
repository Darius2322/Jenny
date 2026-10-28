import Link from "next/link";
import { requireStaff, MODERATION, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { setPostStatus } from "@/lib/admin-actions";

export const metadata = { title: "Posts" };

type Post = { id: string; author_id: string; body: string; status: string; created_at: string };
const VIEWS = [["all", "All"], ["published", "Published"], ["hidden", "Hidden"], ["removed", "Removed"]] as const;

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ status?: string; author?: string; q?: string }> }) {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  const { status = "all", author = "", q = "" } = await searchParams;
  const svc = createServiceClient();
  let req = svc.from("posts").select("id, author_id, body, status, created_at").order("created_at", { ascending: false }).limit(40);
  if (status !== "all") req = req.eq("status", status);
  if (/^[0-9a-f-]{36}$/i.test(author)) req = req.eq("author_id", author);
  const term = q.trim().slice(0, 60).replace(/[\\%_]/g, (c) => `\\${c}`);
  if (term.length >= 2) req = req.ilike("body", `%${term}%`);
  const { data } = await req;
  const posts = (data ?? []) as Post[];
  const ids = [...new Set(posts.map((p) => p.author_id))];
  const names = new Map<string, string>();
  if (ids.length) (await svc.from("profiles").select("id, username").in("id", ids)).data?.forEach((p: { id: string; username: string }) => names.set(p.id, p.username));
  const { data: media } = posts.length ? await svc.from("post_media").select("post_id").in("post_id", posts.map((p) => p.id)) : { data: [] };
  const withMedia = new Set((media ?? []).map((m: { post_id: string }) => m.post_id));

  return (
    <>
      <h1 className="text-2xl font-extrabold">Posts</h1>
      <p className="mt-1 text-sm text-muted">Latest 40. Hiding or removing notifies the author. {author && <Link href="/posts" className="underline">Clear author filter</Link>}</p>
      <form role="search" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">Search post text</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search post text" className="field" autoComplete="off" />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {author && <input type="hidden" name="author" value={author} />}
        <button className="btn btn-primary">Search</button>
      </form>
      <nav aria-label="Status" className="mt-3 flex flex-wrap gap-2">
        {VIEWS.map(([id, label]) => <Link key={id} href={`/posts?status=${id}${author ? `&author=${author}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={status === id ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === id ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{label}</Link>)}
      </nav>
      {posts.length === 0 && <p className="mt-10 text-center text-muted">No posts.</p>}
      <ul className="mt-5 space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="card p-4">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/users/${p.author_id}`} className="font-semibold hover:underline">@{names.get(p.author_id) ?? "unknown"}</Link>
              <span className="text-muted">{new Date(p.created_at).toLocaleString("en-KE")}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "published" ? "bg-brand-tint text-brand-deep" : "bg-red-50 text-red-700"}`}>{p.status}</span>
              {withMedia.has(p.id) && <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold dark:bg-white/10">has photo</span>}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{p.body}</p>
            <form action={setPostStatus} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="postId" value={p.id} />
              {p.status === "published" && <button name="action" value="hide" className="btn btn-secondary !min-h-[40px]">Hide</button>}
              {p.status !== "removed" && <button name="action" value="remove" className="btn btn-secondary !min-h-[40px]">Remove</button>}
              {p.status !== "published" && isAdmin && <button name="action" value="restore" className="btn btn-secondary !min-h-[40px]">Restore</button>}
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
