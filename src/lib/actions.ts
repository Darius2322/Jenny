"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/upload";
import { extractTokens } from "@/lib/tags";

export type ActionState = { error?: string; ok?: boolean; postId?: string } | undefined;

function friendly(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("rate_limit_exceeded")) return "You're doing that too fast. Please wait a few minutes.";
  if (message.includes("violates row-level security")) return "You don't have permission to do that.";
  if (message.includes("duplicate key") && message.includes("username")) return "That username is already taken.";
  return "Something went wrong. Please try again.";
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
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

  // Generate the id here and insert without .select(): RETURNING would run the SELECT policy
  // (which looks the row up by id) before the row is visible, and the insert would be rejected.
  const postId = crypto.randomUUID();
  const { error } = await supabase.from("posts").insert({ id: postId, author_id: user.id, body: body.data });
  if (error) {
    if (uploaded) await supabase.storage.from("post-media").remove([uploaded.path]);
    return { error: friendly(error.message) };
  }
  if (uploaded) {
    const { error: mediaErr } = await supabase.from("post_media").insert({ post_id: postId, storage_path: uploaded.path, mime_type: uploaded.mime, position: 0 });
    if (mediaErr) {
      await supabase.from("posts").delete().eq("id", postId);
      await supabase.storage.from("post-media").remove([uploaded.path]);
      return { error: "Couldn't attach the image. Please try again." };
    }
  }
  // Index #hashtags and @mentions (and notify mentioned people). Failure here must not lose the post.
  const { tags, mentions } = extractTokens(body.data);
  if (tags.length || mentions.length) await supabase.rpc("post_index", { p_post: postId, p_tags: tags, p_mentions: mentions });
  revalidatePath("/home");
  return { ok: true, postId };
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
  const replyRaw = formData.get("replyToId");
  const reply = typeof replyRaw === "string" && replyRaw ? uuid.safeParse(replyRaw) : null;
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId.data, sender_id: user.id, body: body.data, reply_to_id: reply?.success ? reply.data : null,
  });
  if (error) {
    if (error.message.includes("violates row-level security")) return { error: "You can't message this person." };
    return { error: friendly(error.message) };
  }
  revalidatePath("/messages"); // so the DM list isn't stale when you go back
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
  const targetType = z.enum(["post", "comment", "profile", "business", "listing", "gossip"]).safeParse(formData.get("targetType"));
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


export async function toggleRepost(formData: FormData) {
  const id = uuid.safeParse(formData.get("postId"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase.from("reposts").select("post_id").eq("post_id", id.data).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("reposts").delete().eq("post_id", id.data).eq("user_id", user.id);
  else await supabase.from("reposts").insert({ post_id: id.data, user_id: user.id });
  revalidatePath("/home");
  revalidatePath("/profile", "layout");
}

const aliasSchema = z.string().trim().min(2, "Aka must be 2–24 characters.").max(24, "Aka must be 2–24 characters.");

export async function createGossip(_: ActionState, formData: FormData): Promise<ActionState> {
  const body = z.string().trim().min(1, "Write something first.").max(1000, "Gossip can be up to 1000 characters.").safeParse(formData.get("body"));
  if (!body.success) return { error: body.error.issues[0]?.message };
  const replyRaw = formData.get("replyTo");
  const reply = typeof replyRaw === "string" && replyRaw ? uuid.safeParse(replyRaw) : null;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("gossip_post", { p_body: body.data, p_alias: null, p_reply_to: reply?.success ? reply.data : null });
  if (error) return { error: friendly(error.message) };
  return { ok: true };
}

export async function saveGossipAlias(_: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formData.get("alias");
  const { supabase, user } = await requireUser();
  if (typeof raw !== "string" || !raw.trim()) {
    const { error } = await supabase.from("gossip_settings").delete().eq("user_id", user.id);
    return error ? { error: friendly(error.message) } : { ok: true };
  }
  const a = aliasSchema.safeParse(raw);
  if (!a.success) return { error: a.error.issues[0]?.message };
  const { error } = await supabase.from("gossip_settings").upsert({ user_id: user.id, alias: a.data });
  return error ? { error: friendly(error.message) } : { ok: true };
}

export async function toggleGossipPin(gossipId: string, pin: boolean): Promise<boolean> {
  const id = uuid.safeParse(gossipId);
  if (!id.success) return false;
  const { supabase, user } = await requireUser();
  if (pin) {
    const { error } = await supabase.from("gossip_pins").insert({ user_id: user.id, gossip_id: id.data });
    return !error || error.message.includes("duplicate");
  }
  const { error } = await supabase.from("gossip_pins").delete().eq("user_id", user.id).eq("gossip_id", id.data);
  return !error;
}

export async function removeGossip(gossipId: string): Promise<boolean> {
  const id = uuid.safeParse(gossipId);
  if (!id.success) return false;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("gossip_delete", { p_id: id.data });
  return !error;
}

export async function deleteGossip(formData: FormData) {
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  await supabase.rpc("gossip_delete", { p_id: id.data });
  revalidatePath("/gossip");
}


/** Fire-and-forget style toggles for the UI: no page revalidation, the client updates itself. */
export async function likePost(postId: string, like: boolean): Promise<boolean> {
  const id = uuid.safeParse(postId);
  if (!id.success) return false;
  const { supabase, user } = await requireUser();
  if (like) {
    const { error } = await supabase.from("reactions").insert({ post_id: id.data, user_id: user.id, kind: "like" });
    return !error || error.message.includes("duplicate");
  }
  const { error } = await supabase.from("reactions").delete().eq("post_id", id.data).eq("user_id", user.id);
  return !error;
}

export async function repostPost(postId: string, on: boolean): Promise<boolean> {
  const id = uuid.safeParse(postId);
  if (!id.success) return false;
  const { supabase, user } = await requireUser();
  if (on) {
    const { error } = await supabase.from("reposts").insert({ post_id: id.data, user_id: user.id });
    return !error || error.message.includes("duplicate");
  }
  const { error } = await supabase.from("reposts").delete().eq("post_id", id.data).eq("user_id", user.id);
  return !error;
}


export async function deleteMessage(messageId: string): Promise<boolean> {
  const id = uuid.safeParse(messageId);
  if (!id.success) return false;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("messages").delete().eq("id", id.data).eq("sender_id", user.id);
  return !error;
}

export async function togglePinMessage(conversationId: string, messageId: string, pin: boolean): Promise<boolean> {
  const c = uuid.safeParse(conversationId), m = uuid.safeParse(messageId);
  if (!c.success || !m.success) return false;
  const { supabase, user } = await requireUser();
  if (pin) {
    const { error } = await supabase.from("message_pins").insert({ conversation_id: c.data, message_id: m.data, pinned_by: user.id });
    return !error || error.message.includes("duplicate");
  }
  const { error } = await supabase.from("message_pins").delete().eq("conversation_id", c.data).eq("message_id", m.data);
  return !error;
}

export async function togglePinChat(conversationId: string, pin: boolean): Promise<boolean> {
  const c = uuid.safeParse(conversationId);
  if (!c.success) return false;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("conversation_members").update({ pinned_at: pin ? new Date().toISOString() : null })
    .eq("conversation_id", c.data).eq("user_id", user.id);
  revalidatePath("/messages");
  return !error;
}

// ---------- Dating (18+, opt-in) ----------
const GENDERS = ["woman", "man", "nonbinary"] as const;

export async function saveDatingProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("adult") !== "on") return { error: "Confirm that you are 18 or older to continue." };
  const d = Number(formData.get("day")), m = Number(formData.get("month")), y = Number(formData.get("year"));
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return { error: "Enter your date of birth as day, month and year." };
  const dob = new Date(Date.UTC(y, m - 1, d));
  if (dob.getUTCFullYear() !== y || dob.getUTCMonth() !== m - 1 || dob.getUTCDate() !== d) return { error: "That date doesn't exist. Check your date of birth." };
  const cutoff = new Date(); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
  if (dob > cutoff) return { error: "Dating on Jenny is for people aged 18 and over." };
  const gender = z.enum(GENDERS).safeParse(formData.get("gender"));
  if (!gender.success) return { error: "Choose how you identify." };
  const looking = z.array(z.enum(GENDERS)).min(1, "Choose who you'd like to meet.").safeParse(formData.getAll("lookingFor"));
  if (!looking.success) return { error: looking.error.issues[0]?.message };
  const bio = z.string().trim().max(300, "About me can be up to 300 characters.").safeParse(formData.get("bio") ?? "");
  if (!bio.success) return { error: bio.error.issues[0]?.message };
  const region = z.string().trim().max(60).safeParse(formData.get("region") ?? "");
  if (!region.success) return { error: "Area is too long." };
  const { supabase } = await requireUser();
  const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const { error } = await supabase.rpc("dating_save", {
    p_dob: iso, p_gender: gender.data, p_looking_for: looking.data, p_bio: bio.data, p_region: region.data, p_active: formData.get("hidden") !== "on",
  });
  if (error) return { error: error.message.includes("must_be_adult") ? "Dating on Jenny is for people aged 18 and over." : friendly(error.message) };
  revalidatePath("/dating");
  return { ok: true };
}

export async function swipeDating(userId: string, like: boolean): Promise<{ ok: boolean; matched: boolean }> {
  const id = uuid.safeParse(userId);
  if (!id.success) return { ok: false, matched: false };
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("dating_swipe", { p_to: id.data, p_like: like });
  if (error) return { ok: false, matched: false };
  return { ok: true, matched: data === true };
}

export async function pinMatch(userId: string, pin: boolean): Promise<boolean> {
  const id = uuid.safeParse(userId);
  if (!id.success) return false;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("dating_pin", { p_other: id.data, p_pin: pin });
  return !error;
}

// ---------- Settings ----------
const PREF_KEYS = ["notify_follows", "notify_reactions", "notify_comments", "notify_messages", "notify_business_enquiries", "notify_marketing"] as const;

export async function saveNotificationPrefs(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const patch: Record<string, boolean> = {};
  for (const k of PREF_KEYS) patch[k] = formData.get(k) === "on";
  const { error } = await supabase.from("user_preferences").update(patch).eq("user_id", user.id);
  return error ? { error: friendly(error.message) } : { ok: true };
}

export async function saveTheme(theme: string): Promise<boolean> {
  const t = z.enum(["system", "light", "dark"]).safeParse(theme);
  if (!t.success) return false;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_preferences").update({ theme: t.data }).eq("user_id", user.id);
  return !error;
}

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const pw = z.string().min(10, "Use at least 10 characters.").max(128, "Password is too long.").safeParse(formData.get("password"));
  if (!pw.success) return { error: pw.error.issues[0]?.message };
  if (formData.get("password") !== formData.get("confirm")) return { error: "Passwords don't match." };
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { error: "Couldn't change your password. Sign in again and retry." };
  return { ok: true };
}

export async function signOutEverywhere() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}
