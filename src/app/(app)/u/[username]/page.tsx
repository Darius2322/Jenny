import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Link as LinkIcon, Lock } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { queryPosts, PAGE_SIZE } from "@/lib/posts";
import { toggleFollow, toggleBlock, startConversation } from "@/lib/actions";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { coverUrl } from "@/lib/media";
import Image from "next/image";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage({
  params, searchParams,
}: { params: Promise<{ username: string }>; searchParams: Promise<{ before?: string }> }) {
  const { username } = await params;
  const { before } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;

  // RLS decides visibility: a private or blocking profile returns no row, so we show "not found".
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, cover_path, bio, location_text, website, interests, visibility, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) {
    // The profile may exist but be private. Use the lookup RPC (name/avatar only) to show a locked state.
    const { data: stub } = await supabase.rpc("lookup_profile", { p_username: username });
    const s = (stub ?? [])[0] as { id: string; username: string; display_name: string; avatar_path: string | null; visibility: string } | undefined;
    if (!s) notFound();
    const { data: rel } = await supabase.from("follows").select("status").eq("follower_id", user.id).eq("followee_id", s.id).maybeSingle();
    return (
      <div className="px-4 py-10 text-center">
        <div className="flex justify-center"><Avatar name={s.display_name} path={s.avatar_path} size={72} /></div>
        <h1 className="mt-4 text-xl font-bold">{s.display_name}</h1>
        <p className="text-muted">@{s.username}</p>
        <p className="mt-6 flex items-center justify-center gap-2 text-muted"><Lock size={18} aria-hidden="true" /> This account is private.</p>
        <form action={toggleFollow} className="mt-4">
          <input type="hidden" name="targetId" value={s.id} />
          <button type="submit" className="btn btn-primary">{rel ? (rel.status === "pending" ? "Cancel request" : "Unfollow") : "Request to follow"}</button>
        </form>
      </div>
    );
  }

  const isMe = profile.id === user.id;
  const beforeTs = before && !Number.isNaN(Date.parse(before)) ? before : null;

  const [{ data: rel }, { count: followers }, { count: following }, posts, { data: blocked }] = await Promise.all([
    isMe ? Promise.resolve({ data: null }) : supabase.from("follows").select("status").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle(),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", profile.id).eq("status", "accepted"),
    supabase.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", profile.id).eq("status", "accepted"),
    queryPosts(supabase, user.id, { authorId: profile.id, before: beforeTs }),
    isMe ? Promise.resolve({ data: null }) : supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", profile.id).maybeSingle(),
  ]);

  const hasMore = posts.length > PAGE_SIZE;
  const shown = posts.slice(0, PAGE_SIZE);
  const last = shown[shown.length - 1];
  const interests = (profile.interests ?? []) as string[];

  return (
    <>
      {coverUrl(profile.cover_path) && (
        <Image src={coverUrl(profile.cover_path) as string} alt="" width={900} height={300} priority className="h-32 w-full object-cover sm:h-40" />
      )}
      <section className="border-b border-line px-4 py-6 dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <Avatar name={profile.display_name} path={profile.avatar_path} size={72} />
          <div className="flex gap-2">
            {isMe ? (
              <Link href="/settings/profile" className="btn btn-secondary">Edit profile</Link>
            ) : (
              <>
                <form action={toggleFollow}>
                  <input type="hidden" name="targetId" value={profile.id} />
                  <button type="submit" className={`btn ${rel ? "btn-secondary" : "btn-primary"}`}>
                    {rel ? (rel.status === "pending" ? "Requested" : "Following") : "Follow"}
                  </button>
                </form>
                <form action={startConversation}>
                  <input type="hidden" name="targetId" value={profile.id} />
                  <button type="submit" className="btn btn-secondary">Message</button>
                </form>
                <form action={toggleBlock}>
                  <input type="hidden" name="targetId" value={profile.id} />
                  <button type="submit" className="btn btn-secondary">{blocked ? "Unblock" : "Block"}</button>
                </form>
              </>
            )}
          </div>
        </div>

        <h1 className="mt-3 text-xl font-bold">{profile.display_name}</h1>
        <p className="text-muted">@{profile.username}{profile.visibility === "followers" ? " · Private" : ""}</p>
        {profile.bio && <p className="mt-3 whitespace-pre-wrap break-words">{profile.bio}</p>}

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {profile.location_text && <li className="flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{profile.location_text}</li>}
          {profile.website && (
            <li className="flex items-center gap-1">
              <LinkIcon size={14} aria-hidden="true" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow ugc" className="underline">{profile.website.replace(/^https?:\/\//, "")}</a>
            </li>
          )}
        </ul>
        {interests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Interests">
            {interests.map((i) => <li key={i} className="rounded-full bg-surface px-3 py-1 text-xs font-medium dark:bg-white/10">{i}</li>)}
          </ul>
        )}
        <p className="mt-4 flex gap-5 text-sm"><span><strong>{followers ?? 0}</strong> <span className="text-muted">followers</span></span><span><strong>{following ?? 0}</strong> <span className="text-muted">following</span></span></p>
      </section>

      {shown.length === 0 && <p className="px-4 py-10 text-center text-muted">{isMe ? "You haven't posted yet." : "No posts to show."}</p>}
      {shown.map((p) => <PostCard key={p.id} post={p} viewerId={user.id} />)}
      {hasMore && last && (
        <div className="p-4 text-center"><Link href={`/u/${profile.username}?before=${encodeURIComponent(last.created_at)}`} className="btn btn-secondary">Load older posts</Link></div>
      )}
    </>
  );
}
