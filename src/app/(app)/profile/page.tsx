import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Settings, FileText, Heart, Repeat2, Users, UserCheck, Bell, Store, Ghost, HeartHandshake, LogOut, ChevronRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfileHub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("username, display_name, avatar_path, created_at").eq("id", user.id).single();
  if (!me) redirect("/settings");

  const head = { count: "exact", head: true } as const;
  const [posts, likes, reposts, followers, following] = await Promise.all([
    supabase.from("posts").select("id", head).eq("author_id", user.id).eq("status", "published"),
    supabase.from("reactions").select("post_id", head).eq("user_id", user.id),
    supabase.from("reposts").select("post_id", head).eq("user_id", user.id),
    supabase.from("follows").select("follower_id", head).eq("followee_id", user.id).eq("status", "accepted"),
    supabase.from("follows").select("followee_id", head).eq("follower_id", user.id).eq("status", "accepted"),
  ]);
  const joined = new Date(me.created_at as string).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  const stats = [
    { label: "Posts", n: posts.count ?? 0, href: "/profile/posts" },
    { label: "Likes", n: likes.count ?? 0, href: "/profile/likes" },
    { label: "Reposts", n: reposts.count ?? 0, href: "/profile/reposts" },
    { label: "Followers", n: followers.count ?? 0, href: "/profile/followers" },
    { label: "Following", n: following.count ?? 0, href: "/profile/following" },
  ];
  const groups: { title: string; items: { href: string; label: string; hint?: string; icon: typeof Search }[] }[] = [
    { title: "Your activity", items: [
      { href: "/profile/posts", label: "My posts", icon: FileText },
      { href: "/profile/likes", label: "Liked posts", icon: Heart },
      { href: "/profile/reposts", label: "Reposts", icon: Repeat2 },
      { href: "/profile/following", label: "People I follow", icon: UserCheck },
      { href: "/profile/followers", label: "My followers", icon: Users },
    ] },
    { title: "Explore", items: [
      { href: "/gossip", label: "Gossip", hint: "Anonymous", icon: Ghost },
      { href: "/dating", label: "Dating", hint: "Coming soon", icon: HeartHandshake },
      { href: "/business", label: "My business", icon: Store },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ] },
    { title: "Account", items: [
      { href: "/settings", label: "Settings", hint: "Profile, photo, privacy", icon: Settings },
      { href: `/u/${me.username}`, label: "View public profile", icon: ExternalLink },
    ] },
  ];

  return (
    <>
      <section className="flex items-center gap-4 px-5 pb-2 pt-6">
        <Avatar name={me.display_name} path={me.avatar_path} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{me.display_name}</h1>
          <p className="truncate text-sm text-muted">@{me.username} · Joined {joined}</p>
        </div>
        <Link href="/discover" aria-label="Search people and businesses" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white shadow-glow"><Search size={22} aria-hidden="true" /></Link>
      </section>

      <ul className="grid grid-cols-5 gap-1 px-4 py-4 text-center">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-2xl bg-surface py-3 hover:brightness-95 dark:bg-white/10">
              <span className="block text-lg font-extrabold">{s.n}</span>
              <span className="block text-[11px] font-medium text-muted">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {groups.map((g) => (
        <section key={g.title} aria-label={g.title} className="px-4 pb-4">
          <h2 className="eyebrow px-1 pb-2 pt-3">{g.title}</h2>
          <ul className="card divide-y divide-line overflow-hidden dark:divide-white/10">
            {g.items.map(({ href, label, hint, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex min-h-[56px] items-center gap-3 px-4 hover:bg-surface dark:hover:bg-white/10">
                  <span className="chip !h-9 !w-9 !rounded-xl"><Icon size={18} aria-hidden="true" /></span>
                  <span className="flex-1 font-medium">{label}</span>
                  {hint && <span className="text-xs text-muted">{hint}</span>}
                  <ChevronRight size={18} className="text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <form action={logout} className="px-4 pb-6">
        <button type="submit" className="btn btn-secondary w-full"><LogOut size={18} aria-hidden="true" /> Sign out</button>
      </form>
    </>
  );
}
