import { NextResponse } from "next/server";
import { createClient, getUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Everything the signed-in person authored, as a JSON download. Only their own rows (RLS plus explicit filters). */
export async function GET() {
  const { data: { user } } = await getUserCached();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const supabase = await createClient();
  const [profile, posts, comments, reactions, reposts, follows, prefs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("posts").select("id, body, status, created_at, edited_at").eq("author_id", user.id),
    supabase.from("comments").select("id, post_id, body, status, created_at").eq("author_id", user.id),
    supabase.from("reactions").select("post_id, kind, created_at").eq("user_id", user.id),
    supabase.from("reposts").select("post_id, created_at").eq("user_id", user.id),
    supabase.from("follows").select("follower_id, followee_id, status, created_at").or(`follower_id.eq.${user.id},followee_id.eq.${user.id}`),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  const body = JSON.stringify({
    exported_at: new Date().toISOString(), email: user.email, account_created: user.created_at,
    profile: profile.data, posts: posts.data ?? [], comments: comments.data ?? [], likes: reactions.data ?? [], reposts: reposts.data ?? [],
    follows: follows.data ?? [], settings: prefs.data,
  }, null, 2);
  return new NextResponse(body, { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="jenny-my-data.json"', "Cache-Control": "no-store" } });
}
