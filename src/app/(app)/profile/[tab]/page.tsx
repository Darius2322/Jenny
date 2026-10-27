import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { queryPosts, postsByIds } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

const TABS = {
  posts: "My posts", likes: "Liked posts", reposts: "Reposts", followers: "Followers", following: "People I follow",
} as const;
type Tab = keyof typeof TABS;

type Person = { id: string; username: string; display_name: string; avatar_path: string | null };

export default async function ProfileTab({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!(tab in TABS)) notFound();
  const t = tab as Tab;
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");

  let posts: Awaited<ReturnType<typeof postsByIds>> = [];
  let people: Person[] = [];

  if (t === "posts") posts = (await queryPosts(supabase, user.id, { authorId: user.id })).slice(0, 20);
  if (t === "likes" || t === "reposts") {
    const { data } = t === "likes"
      ? await supabase.from("reactions").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40)
      : await supabase.from("reposts").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40);
    posts = await postsByIds(supabase, user.id, ((data ?? []) as { post_id: string }[]).map((r) => r.post_id));
  }
  if (t === "followers" || t === "following") {
    const col = t === "followers" ? "follower_id" : "followee_id";
    const where = t === "followers" ? "followee_id" : "follower_id";
    const { data } = await supabase.from("follows").select(col).eq(where, user.id).eq("status", "accepted").limit(200);
    const ids = ((data ?? []) as unknown as Record<string, string>[]).map((r) => r[col]).filter((x): x is string => !!x);
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, username, display_name, avatar_path").in("id", ids);
      people = (ps ?? []) as Person[];
    }
  }

  const isPeople = t === "followers" || t === "following";
  const empty = isPeople ? people.length === 0 : posts.length === 0;
  const emptyText: Record<Tab, string> = {
    posts: "You haven't posted yet.", likes: "Posts you like will show up here.", reposts: "Posts you repost will show up here.",
    followers: "No followers yet.", following: "You aren't following anyone yet. Search for people to follow.",
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-5">
        <Link href="/profile" aria-label="Back to profile" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface dark:bg-white/10"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <h1 className="text-2xl font-extrabold">{TABS[t]}</h1>
      </div>
      {empty && (
        <div className="px-6 py-14 text-center">
          <p className="text-muted">{emptyText[t]}</p>
          {t === "following" && <Link href="/discover" className="btn btn-primary mt-5">Find people</Link>}
        </div>
      )}
      {isPeople ? (
        <ul className="mt-3 divide-y divide-line dark:divide-white/10">
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/u/${p.username}`} className="flex min-h-[64px] items-center gap-3 px-5 hover:bg-surface dark:hover:bg-white/10">
                <Avatar name={p.display_name} path={p.avatar_path} size={44} />
                <span className="min-w-0"><span className="block truncate font-semibold">{p.display_name}</span><span className="block truncate text-sm text-muted">@{p.username}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">{posts.map((p) => <PostCard key={p.id} post={p} viewerId={user.id} />)}</div>
      )}
    </>
  );
}
