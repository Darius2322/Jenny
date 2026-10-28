import "server-only";
import { createServiceClient } from "./supabase-service";

export type Target = { text: string; status: string | null; href: string | null; authorId: string | null };

/** Human-readable preview of whatever a report points at. Gossip authors are intentionally NOT included. */
export async function loadTargets(items: { target_type: string; target_id: string }[]): Promise<Map<string, Target>> {
  const svc = createServiceClient();
  const out = new Map<string, Target>();
  const ids = (t: string) => [...new Set(items.filter((i) => i.target_type === t).map((i) => i.target_id))];
  const [posts, comments, profiles, businesses, gossip] = await Promise.all([
    ids("post").length ? svc.from("posts").select("id, body, status, author_id").in("id", ids("post")) : { data: [] },
    ids("comment").length ? svc.from("comments").select("id, body, status, author_id, post_id").in("id", ids("comment")) : { data: [] },
    ids("profile").length ? svc.from("profiles").select("id, username, display_name, status").in("id", ids("profile")) : { data: [] },
    ids("business").length ? svc.from("businesses").select("id, name, handle, status").in("id", ids("business")) : { data: [] },
    ids("gossip").length ? svc.from("gossip_posts").select("id, alias, body, status").in("id", ids("gossip")) : { data: [] },
  ]);
  (posts.data ?? []).forEach((p: { id: string; body: string; status: string; author_id: string }) => out.set(`post:${p.id}`, { text: p.body, status: p.status, href: null, authorId: p.author_id }));
  (comments.data ?? []).forEach((c: { id: string; body: string; status: string; author_id: string }) => out.set(`comment:${c.id}`, { text: c.body, status: c.status, href: null, authorId: c.author_id }));
  (profiles.data ?? []).forEach((p: { id: string; username: string; display_name: string; status: string }) => out.set(`profile:${p.id}`, { text: `${p.display_name} (@${p.username})`, status: p.status, href: `/users/${p.id}`, authorId: p.id }));
  (businesses.data ?? []).forEach((b: { id: string; name: string; handle: string; status: string }) => out.set(`business:${b.id}`, { text: `${b.name} (@${b.handle})`, status: b.status, href: "/businesses", authorId: null }));
  (gossip.data ?? []).forEach((g: { id: string; alias: string | null; body: string; status: string }) => out.set(`gossip:${g.id}`, { text: `${g.alias ?? "Anonymous"}: ${g.body}`, status: g.status, href: `/gossip/${g.id}`, authorId: null }));
  return out;
}
