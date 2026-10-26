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
    if (report.target_type !== "post" && report.target_type !== "comment") return; // not applicable to this target
    const table = report.target_type === "post" ? "posts" : "comments";
    const { data: row } = await svc.from(table).update({ status: action === "hide" ? "hidden" : "removed" }).eq("id", report.target_id).select("author_id").maybeSingle();
    if (!row) return; // content no longer exists
    authorId = row.author_id as string;
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
