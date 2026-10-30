"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, audit, ADMINS, MODERATION } from "./staff";
import { createServiceClient } from "./supabase-service";

const uuid = z.string().uuid();
const note = z.string().trim().max(500).optional().transform((v) => v || null);

async function notifyModeration(recipientId: string | null, action: string) {
  if (!recipientId) return;
  await createServiceClient().from("notifications").insert({ recipient_id: recipientId, type: "moderation", data: { action } });
}

/** Resolve a content report. hide/remove only apply to posts and comments. */
export async function resolveReport(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({
    reportId: uuid,
    action: z.enum(["dismiss", "hide", "remove", "mark_actioned"]),
    note,
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { reportId, action } = parsed.data;

  const svc = createServiceClient();
  const { data: report } = await svc.from("content_reports").select("id, target_type, target_id, status").eq("id", reportId).maybeSingle();
  if (!report || !["open", "reviewing"].includes(report.status)) return;

  let authorId: string | null = null;
  if (action === "hide" || action === "remove") {
    if (report.target_type === "gossip") {
      // Gossip has no "hidden" state; both choices remove it. The author is never looked up or notified here (anonymity).
      const { data: row } = await svc.from("gossip_posts").update({ status: "removed" }).eq("id", report.target_id).select("id").maybeSingle();
      if (!row) return;
    } else {
      if (report.target_type !== "post" && report.target_type !== "comment") return; // not applicable to this target
      const table = report.target_type === "post" ? "posts" : "comments";
      const { data: row } = await svc.from(table).update({ status: action === "hide" ? "hidden" : "removed" }).eq("id", report.target_id).select("author_id").maybeSingle();
      if (!row) return; // content no longer exists
      authorId = row.author_id as string;
    }
  }

  await svc.from("content_reports").update({
    status: action === "dismiss" ? "dismissed" : "actioned", resolved_at: new Date().toISOString(), assigned_to: staff.id,
  }).eq("id", reportId);

  if (action !== "mark_actioned") {
    await svc.from("moderation_actions").insert({
      report_id: reportId, moderator_id: staff.id, target_type: report.target_type, target_id: report.target_id,
      action: action === "dismiss" ? "dismiss" : action, note: parsed.data.note,
    });
  }
  if (authorId) await notifyModeration(authorId, action);
  await audit(staff.id, `report.${action}`, report.target_type, report.target_id, { reportId });
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/");
}

export async function setBusinessState(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ businessId: uuid, action: z.enum(["approve", "suspend", "reinstate", "verify", "unverify"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { businessId, action } = parsed.data;
  if ((action === "verify" || action === "unverify") && !ADMINS.includes(staff.role)) return; // verification badges: administrators only

  const patch =
    action === "approve" || action === "reinstate" ? { status: "active" }
    : action === "suspend" ? { status: "suspended" }
    : action === "verify" ? { verification_status: "verified" }
    : { verification_status: "unverified" };
  const { error } = await createServiceClient().from("businesses").update(patch).eq("id", businessId);
  if (error) return;
  await audit(staff.id, `business.${action}`, "business", businessId);
  revalidatePath("/businesses");
  revalidatePath("/");
}

export async function reviewNews(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({
    submissionId: uuid,
    action: z.enum(["publish", "reject"]),
    label: z.enum(["unverified_submission", "sourced_news", "opinion", "rumor_unverified"]),
    note,
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { submissionId, action, label } = parsed.data;

  const svc = createServiceClient();
  const { data: item } = await svc.from("news_submissions").select("id, source_url, status").eq("id", submissionId).maybeSingle();
  if (!item || item.status !== "pending") return;
  // A story can only be labelled "sourced news" if it actually links a source.
  if (action === "publish" && label === "sourced_news" && !item.source_url) return;

  await svc.from("news_submissions").update({
    status: action === "publish" ? "published" : "rejected", label, reviewed_by: staff.id, reviewed_at: new Date().toISOString(), review_note: parsed.data.note,
  }).eq("id", submissionId);
  await audit(staff.id, `news.${action}`, "news", submissionId, { label });
  revalidatePath("/news");
  revalidatePath("/");
}

export async function setUserStatus(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ userId: uuid, action: z.enum(["suspend", "reinstate"]), note }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { userId, action } = parsed.data;
  if (action === "reinstate" && !ADMINS.includes(staff.role)) return; // reinstating: administrators only
  if (userId === staff.id) return; // never act on yourself

  const svc = createServiceClient();
  const { data: targetRole } = await svc.from("admin_roles").select("user_id").eq("user_id", userId).maybeSingle();
  if (targetRole) return; // staff accounts are managed separately, never through this screen

  const { error } = await svc.from("profiles").update({ status: action === "suspend" ? "suspended" : "active" }).eq("id", userId);
  if (error) return;
  await svc.from("moderation_actions").insert({
    moderator_id: staff.id, target_type: "profile", target_id: userId, action: action === "suspend" ? "suspend_user" : "reinstate_user", note: parsed.data.note,
  });
  await notifyModeration(userId, action === "suspend" ? "suspend_user" : "reinstate_user");
  await audit(staff.id, `user.${action}`, "profile", userId);
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
}

/**
 * Permanently deletes an account after a user's own deletion request. Administrators only.
 * Posts, comments, messages, follows etc. cascade from the profile. Uploaded files are removed first.
 * Refuses staff accounts and anyone who still owns a business (the database blocks that anyway).
 */
export async function processDeletion(formData: FormData) {
  const staff = await requireStaff(ADMINS);
  const parsed = z.object({ requestId: uuid, userId: uuid, confirm: z.string().trim().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { requestId, userId, confirm } = parsed.data;
  if (userId === staff.id) return;

  const svc = createServiceClient();
  const { data: request } = await svc.from("account_deletion_requests").select("id, user_id, status").eq("id", requestId).maybeSingle();
  if (!request || request.user_id !== userId || request.status !== "requested") return;

  const { data: profile } = await svc.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (!profile || profile.username !== confirm.toLowerCase()) return; // typed username must match

  const [{ data: role }, { count: owned }] = await Promise.all([
    svc.from("admin_roles").select("user_id").eq("user_id", userId).maybeSingle(),
    svc.from("businesses").select("id", { count: "exact", head: true }).eq("created_by", userId),
  ]);
  if (role || (owned ?? 0) > 0) return;

  for (const bucket of ["avatars", "covers", "post-media"] as const) {
    const { data: files } = await svc.storage.from(bucket).list(userId, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
    if (paths.length) await svc.storage.from(bucket).remove(paths);
  }

  await audit(staff.id, "user.delete", "user", userId, { requestId });
  const { error } = await svc.auth.admin.deleteUser(userId);
  if (error) {
    await audit(staff.id, "user.delete_failed", "user", userId, { requestId });
    return;
  }
  revalidatePath("/deletions");
}


/** Hide, remove or restore a post directly (outside a report). */
export async function setPostStatus(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ postId: uuid, action: z.enum(["hide", "remove", "restore"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { postId, action } = parsed.data;
  if (action === "restore" && !ADMINS.includes(staff.role)) return;
  const svc = createServiceClient();
  const { data: row } = await svc.from("posts").update({ status: action === "hide" ? "hidden" : action === "remove" ? "removed" : "published" }).eq("id", postId).select("author_id").maybeSingle();
  if (!row) return;
  if (action !== "restore") await notifyModeration(row.author_id as string, action);
  await audit(staff.id, `post.${action}`, "post", postId);
  revalidatePath("/posts");
}

/** Remove or restore gossip. Never touches or reveals the author. */
export async function setGossipStatus(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ gossipId: uuid, action: z.enum(["remove", "restore"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { gossipId, action } = parsed.data;
  if (action === "restore" && !ADMINS.includes(staff.role)) return;
  const { data } = await createServiceClient().from("gossip_posts").update({ status: action === "remove" ? "removed" : "published" }).eq("id", gossipId).select("id").maybeSingle();
  if (!data) return;
  await audit(staff.id, `gossip.${action}`, "gossip", gossipId);
  revalidatePath("/gossip");
  revalidatePath(`/gossip/${gossipId}`);
}

const STAFF_ROLES = ["administrator", "moderator", "support"] as const;

/** Grant a staff role to an existing member. System owner only. */
export async function addStaff(formData: FormData) {
  const staff = await requireStaff(["system_owner"]);
  const parsed = z.object({ username: z.string().trim().toLowerCase().min(3).max(30), role: z.enum(STAFF_ROLES) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const svc = createServiceClient();
  const { data: target } = await svc.from("profiles").select("id").eq("username", parsed.data.username).maybeSingle();
  if (!target) return;
  const { data: existing } = await svc.from("admin_roles").select("role").eq("user_id", target.id).maybeSingle();
  if (existing?.role === "system_owner") return;
  const { error } = await svc.from("admin_roles").upsert({ user_id: target.id, role: parsed.data.role });
  if (error) return;
  await audit(staff.id, "staff.set_role", "user", target.id, { role: parsed.data.role });
  revalidatePath("/staff");
}

export async function removeStaff(formData: FormData) {
  const staff = await requireStaff(["system_owner"]);
  const parsed = z.object({ userId: uuid }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.userId === staff.id) return;
  const svc = createServiceClient();
  const { data: existing } = await svc.from("admin_roles").select("role").eq("user_id", parsed.data.userId).maybeSingle();
  if (!existing || existing.role === "system_owner") return;
  const { error } = await svc.from("admin_roles").delete().eq("user_id", parsed.data.userId);
  if (error) return;
  await audit(staff.id, "staff.remove_role", "user", parsed.data.userId);
  revalidatePath("/staff");
}

// ---------- Ads review ----------
export async function reviewAd(formData: FormData) {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ adId: uuid, action: z.enum(["approve", "reject", "pause", "end", "resume"]), note, days: z.coerce.number().int().min(1).max(365).optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { adId, action, days } = parsed.data;
  const status = { approve: "approved", resume: "approved", reject: "rejected", pause: "paused", end: "ended" }[action];
  const svc = createServiceClient();
  const patch: Record<string, unknown> = { status, admin_note: parsed.data.note };
  if (action === "approve") { patch.starts_at = new Date().toISOString(); patch.ends_at = new Date(Date.now() + (days ?? 30) * 86400000).toISOString(); }
  const { data: ad } = await svc.from("ads").update(patch).eq("id", adId).select("advertiser_id").maybeSingle();
  if (!ad) return;
  if (action === "approve" || action === "reject") await svc.from("notifications").insert({ recipient_id: ad.advertiser_id, type: "ad_review", data: { action } });
  await audit(staff.id, `ad.${action}`, "ad", adId);
  revalidatePath("/ads");
}

// ---------- Action center ----------
const kinds = ["post", "comment", "gossip", "gossip_group", "business", "ad"] as const;

export async function removeContent(formData: FormData): Promise<void> {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ kind: z.enum(kinds), id: uuid, note }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { kind, id } = parsed.data;
  const svc = createServiceClient();
  let ok = false;
  if (kind === "post" || kind === "comment") {
    const { data } = await svc.from(kind === "post" ? "posts" : "comments").update({ status: "removed" }).eq("id", id).select("author_id").maybeSingle();
    ok = !!data; if (data) await notifyModeration(data.author_id as string, "remove");
  } else if (kind === "gossip") {
    const { data } = await svc.from("gossip_posts").update({ status: "removed" }).eq("id", id).select("id").maybeSingle(); ok = !!data;
  } else if (kind === "gossip_group") {
    const { data } = await svc.from("gossip_groups").update({ status: "closed" }).eq("id", id).select("id").maybeSingle(); ok = !!data;
  } else if (kind === "business") {
    const { data } = await svc.from("businesses").update({ status: "suspended" }).eq("id", id).select("id").maybeSingle(); ok = !!data;
  } else {
    const { data } = await svc.from("ads").update({ status: "ended" }).eq("id", id).select("id").maybeSingle(); ok = !!data;
  }
  if (ok) await audit(staff.id, `action.remove_${kind}`, kind, id, { note: parsed.data.note });
  revalidatePath("/actions");
}

/** Suspend / reinstate / clear dating data, looked up by @username. */
export async function userAction(formData: FormData): Promise<void> {
  const staff = await requireStaff(MODERATION);
  const parsed = z.object({ username: z.string().trim().toLowerCase().replace(/^@/, "").pipe(z.string().regex(/^[a-z0-9_]{3,30}$/)), action: z.enum(["suspend", "reinstate", "clear_dating", "force_signout"]), note }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { action } = parsed.data;
  if ((action === "reinstate" || action === "force_signout") && !ADMINS.includes(staff.role)) return;
  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("id").eq("username", parsed.data.username).maybeSingle();
  if (!p || p.id === staff.id) return;
  const { data: isStaff } = await svc.from("admin_roles").select("user_id").eq("user_id", p.id).maybeSingle();
  if (isStaff) return;
  if (action === "suspend" || action === "reinstate") await svc.from("profiles").update({ status: action === "suspend" ? "suspended" : "active" }).eq("id", p.id);
  else if (action === "clear_dating") await svc.from("dating_profiles").update({ active: false, bio: null, region: null, prompt: null, answer: null, hobbies: [] }).eq("user_id", p.id);
  else await svc.auth.admin.signOut(p.id as string, "global").catch(() => undefined);
  await audit(staff.id, `action.${action}`, "profile", p.id as string, { note: parsed.data.note });
  revalidatePath("/actions");
}

export async function announce(formData: FormData): Promise<void> {
  const staff = await requireStaff(ADMINS);
  const parsed = z.object({ message: z.string().trim().min(5).max(200) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const svc = createServiceClient();
  const { data } = await svc.from("profiles").select("id").eq("status", "active").limit(5000);
  const rows = (data ?? []).map((r) => ({ recipient_id: r.id as string, type: "announcement", data: { message: parsed.data.message } }));
  for (let i = 0; i < rows.length; i += 500) await svc.from("notifications").insert(rows.slice(i, i + 500));
  await audit(staff.id, "action.announce", "broadcast", staff.id, { recipients: rows.length });
  revalidatePath("/actions");
}
