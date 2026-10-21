import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "./supabase-server";
import { createServiceClient } from "./supabase-service";

export type StaffRole = "system_owner" | "administrator" | "moderator" | "support";
export const ALL_STAFF: StaffRole[] = ["system_owner", "administrator", "moderator", "support"];
export const MODERATION: StaffRole[] = ["system_owner", "administrator", "moderator"];
export const ADMINS: StaffRole[] = ["system_owner", "administrator"];

export type Staff = { id: string; email: string | undefined; role: StaffRole };

/**
 * The single gate for every admin page AND every server action (actions are public HTTP endpoints, so each one calls this).
 * Requires: a valid session, a row in admin_roles, an allowed role, and a verified second factor (aal2).
 * The role is always read from the database, never from the request.
 */
export async function requireStaff(allowed: StaffRole[] = ALL_STAFF): Promise<Staff> {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await createServiceClient().from("admin_roles").select("role").eq("user_id", user.id).maybeSingle();
  const role = row?.role as StaffRole | undefined;
  if (!role) redirect("/denied");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/mfa");

  if (!allowed.includes(role)) redirect("/denied");
  return { id: user.id, email: user.email, role };
}

/** Append-only record of privileged actions. */
export async function audit(actor: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await createServiceClient().from("admin_audit_logs").insert({ actor_id: actor, action, target_type: targetType, target_id: targetId, metadata });
}
