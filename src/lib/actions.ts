"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/upload";

export type ActionState = { error?: string; ok?: boolean } | undefined;

function friendly(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("rate_limit_exceeded")) return "You're doing that too fast. Please wait a few minutes.";
  if (message.includes("violates row-level security")) return "You don't have permission to do that.";
  if (message.includes("duplicate key") && message.includes("username")) return "That username is already taken.";
  return "Something went wrong. Please try again.";
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

const bodySchema = z.string().trim().min(1, "Write something first.").max(2000, "Posts can be up to 2000 characters.");

export async function createPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const body = bodySchema.safeParse(formData.get("body"));
  if (!body.success) return { error: body.error.issues[0]?.message };
  const { supabase, user } = await requireUser();

  let uploaded: { path: string; mime: string } | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const res = await uploadImage(supabase, "post-media", user.id, file, 5 * 1024 * 1024);
    if ("error" in res) return { error: res.error };
    uploaded = res;
  }

  const { data: post, error } = await supabase.from("posts").insert({ author_id: user.id, body: body.data }).select("id").single();
  if (error || !post) {
    if (uploaded) await supabase.storage.from("post-media").remove([uploaded.path]);
    return { error: friendly(error?.message) };
  }
  if (uploaded) {
    const { error: mediaErr } = await supabase.from("post_media").insert({ post_id: post.id, storage_path: uploaded.path, mime_type: uploaded.mime, position: 0 });
    if (mediaErr) {
      // Don't leave a half-created post: remove it and the orphaned file.
      await supabase.from("posts").delete().eq("id", post.id);
      await supabase.storage.from("post-media").remove([uploaded.path]);
      return { error: "Couldn't attach the image. Please try again." };
    }
  }
  revalidatePath("/home");
  return { ok: true };
}

export async function updateAvatar(_: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File)) return { error: "Choose an image first." };
  const { supabase, user } = await requireUser();
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const res = await uploadImage(supabase, "avatars", user.id, file, 2 * 1024 * 1024);
  if ("error" in res) return { error: res.error };
  const { error } = await supabase.from("profiles").update({ avatar_path: res.path }).eq("id", user.id);
  if (error) {
    await supabase.storage.from("avatars").remove([res.path]);
    return { error: friendly(error.message) };
  }
  const old = before?.avatar_path as string | null | undefined;
  if (old && old.startsWith(`${user.id}/`)) await supabase.storage.from("avatars").remove([old]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
  const old = data?.avatar_path as string | null | undefined;
  if (old && old.startsWith(`${user.id}/`)) await supabase.storage.from("avatars").remove([old]);
  revalidatePath("/", "layout");
}

export async function updateCover(_: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("cover");
  if (!(file instanceof File)) return { error: "Choose an image first." };
  const { supabase, user } = await requireUser();
  const { data: before } = await supabase.from("profiles").select("cover_path").eq("id", user.id).single();
  const res = await uploadImage(supabase, "covers", user.id, file, 4 * 1024 * 1024);
  if ("error" in res) return { error: res.error };
  const { error } = await supabase.from("profiles").update({ cover_path: res.path }).eq("id", user.id);
  if (error) {
    await supabase.storage.from("covers").remove([res.path]);
    return { error: friendly(error.message) };
  }
  const old = before?.cover_path as string | null | undefined;
  if (old && old.startsWith(`${user.id}/`)) await supabase.storage.from("covers").remove([old]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCover() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("cover_path").eq("id", user.id).single();
  await supabase.from("profiles").update({ cover_path: null }).eq("id", user.id);
  const old = data?.cover_path as string | null | undefined;
  if (old && old.startsWith(`${user.id}/`)) await supabase.storage.from("covers").remove([old]);
  revalidatePath("/", "layout");
}

export async function startConversation(formData: FormData) {
  const target = uuid.safeParse(formData.get("targetId"));
  if (!target.success) return;
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("start_conversation", { p_other: target.data });
  if (error || typeof data !== "string") redirect("/messages?error=1");
  redirect(`/messages/${data}`);
}

export async function sendMessage(_: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = uuid.safeParse(formData.get("conversationId"));
  const body = z.string().trim().min(1, "Write a message first.").max(2000, "Messages can be up to 2000 characters.").safeParse(formData.get("body"));
  if (!conversationId.success) return { error: "Invalid conversation." };
  if (!body.success) return { error: body.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId.data, sender_id: user.id, body: body.data });
  if (error) {
    if (error.message.includes("violates row-level security")) return { error: "You can't message this person." };
    return { error: friendly(error.message) };
  }
  revalidatePath(`/messages/${conversationId.data}`);
  revalidatePath("/messages");
  return { ok: true };
}

const uuid = z.string().uuid();

export async function deletePost(formData: FormData) {
  const id = uuid.safeParse(formData.get("postId"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  const { data: media } = await supabase.from("post_media").select("storage_path").eq("post_id", id.data);
  const { data: deleted } = await supabase.from("posts").delete().eq("id", id.data).eq("author_id", user.id).select("id"); // RLS also restricts this to the author
  if (deleted && deleted.length > 0 && media?.length) {
    const own = media.map((m: { storage_path: string }) => m.storage_path).filter((p: string) => p.startsWith(`${user.id}/`));
    if (own.length) await supabase.storage.from("post-media").remove(own);
  }
  revalidatePath("/home");
  revalidatePath("/u/[username]", "page");
  if (formData.get("redirect") === "home") redirect("/home");
}

export async function toggleReaction(formData: FormData) {
  const id = uuid.safeParse(formData.get("postId"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase.from("reactions").select("post_id").eq("post_id", id.data).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("reactions").delete().eq("post_id", id.data).eq("user_id", user.id);
  else await supabase.from("reactions").insert({ post_id: id.data, user_id: user.id, kind: "like" });
  revalidatePath("/home");
  revalidatePath(`/post/${id.data}`);
  revalidatePath("/u/[username]", "page");
}

export async function addComment(_: ActionState, formData: FormData): Promise<ActionState> {
  const postId = uuid.safeParse(formData.get("postId"));
  const body = z.string().trim().min(1, "Write a comment first.").max(1000, "Comments can be up to 1000 characters.").safeParse(formData.get("body"));
  if (!postId.success) return { error: "Invalid post." };
  if (!body.success) return { error: body.error.issues[0]?.message };
  const parentRaw = formData.get("parentId");
  const parent = typeof parentRaw === "string" && parentRaw ? uuid.safeParse(parentRaw) : null;
  if (parent && !parent.success) return { error: "Invalid reply target." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("comments").insert({
    post_id: postId.data, author_id: user.id, body: body.data, parent_id: parent?.success ? parent.data : null,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/post/${postId.data}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData) {
  const id = uuid.safeParse(formData.get("commentId"));
  const postId = uuid.safeParse(formData.get("postId"));
  if (!id.success || !postId.success) return;
  const { supabase } = await requireUser();
  await supabase.from("comments").delete().eq("id", id.data);
  revalidatePath(`/post/${postId.data}`);
}

export async function toggleFollow(formData: FormData) {
  const target = uuid.safeParse(formData.get("targetId"));
  if (!target.success) return;
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", target.data).maybeSingle();
  if (existing) await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", target.data);
  else await supabase.from("follows").insert({ follower_id: user.id, followee_id: target.data });
  revalidatePath("/u/[username]", "page");
  revalidatePath("/home");
}

export async function acceptFollowRequest(formData: FormData) {
  const follower = uuid.safeParse(formData.get("followerId"));
  if (!follower.success) return;
  const { supabase, user } = await requireUser();
  await supabase.from("follows").update({ status: "accepted" }).eq("follower_id", follower.data).eq("followee_id", user.id);
  revalidatePath("/notifications");
}

export async function reportContent(formData: FormData) {
  const targetType = z.enum(["post", "comment", "profile", "business", "listing"]).safeParse(formData.get("targetType"));
  const targetId = uuid.safeParse(formData.get("targetId"));
  const reason = z.enum(["spam", "harassment", "hate", "sexual_content", "violence", "fraud", "misinformation", "privacy", "underage", "other"]).safeParse(formData.get("reason"));
  if (!targetType.success || !targetId.success || !reason.success) return;
  const { supabase, user } = await requireUser();
  await supabase.from("content_reports").insert({ reporter_id: user.id, target_type: targetType.data, target_id: targetId.data, reason: reason.data });
}

export async function toggleBlock(formData: FormData) {
  const target = uuid.safeParse(formData.get("targetId"));
  if (!target.success) return;
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", target.data).maybeSingle();
  if (existing) await supabase.from("user_blocks").delete().eq("blocker_id", user.id).eq("blocked_id", target.data);
  else await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: target.data });
  revalidatePath("/", "layout");
}

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Enter your name.").max(60),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, "Username: 3–30 letters, numbers or underscores."),
  bio: z.string().trim().max(300, "Bio can be up to 300 characters.").optional(),
  location_text: z.string().trim().max(80).optional(),
  website: z.string().trim().max(200).optional().refine((v) => !v || /^https?:\/\/[^\s]{3,200}$/i.test(v), "Website must start with http:// or https://"),
  interests: z.string().trim().optional(),
  visibility: z.enum(["public", "followers"]),
});

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const interests = (d.interests ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 15);
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({
    display_name: d.display_name, username: d.username, bio: d.bio || null, location_text: d.location_text || null,
    website: d.website || null, interests, visibility: d.visibility,
    discoverable: formData.get("discoverable") === "on", profile_completed: true,
  }).eq("id", user.id);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await requireUser();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  revalidatePath("/notifications", "layout");
}

export async function requestAccountDeletion(_: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE to confirm." };
  const reason = z.string().trim().max(500).optional().safeParse(formData.get("reason") || undefined);
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id, status: "requested", reason: reason.success && reason.data ? reason.data : null,
  });
  if (error) {
    if (error.message.includes("duplicate key")) return { error: "You already have a deletion request open." };
    return { error: friendly(error.message) };
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function cancelAccountDeletion() {
  const { supabase, user } = await requireUser();
  await supabase.from("account_deletion_requests").update({ status: "cancelled" }).eq("user_id", user.id).eq("status", "requested");
  revalidatePath("/settings");
}
