"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { BUSINESS_CATEGORIES } from "@/lib/business";
import { uploadImage } from "@/lib/upload";

export type BizState = { error?: string; field?: string; ok?: boolean } | undefined;

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  return { supabase, user };
}

function friendly(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("rate_limit_exceeded")) return "You're doing that too fast. Please try again later.";
  if (message.includes("duplicate key") && message.includes("handle")) return "That business handle is already taken.";
  if (message.includes("violates row-level security")) return "You don't have permission to do that.";
  return "Something went wrong. Please try again.";
}

const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const profileFields = {
  name: z.string().trim().min(2, "Business name must be at least 2 characters.").max(80),
  category: z.enum(BUSINESS_CATEGORIES, { errorMap: () => ({ message: "Choose a category." }) }),
  description: optional(1000),
  location_text: optional(80),
  website: z.string().trim().max(200).optional().refine((v) => !v || /^https?:\/\/[^\s]{3,200}$/i.test(v), "Website must start with http:// or https://").transform((v) => (v ? v : null)),
  public_email: z.string().trim().max(120).optional().refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid public email or leave it blank.").transform((v) => (v ? v : null)),
  public_phone: z.string().trim().max(20).optional().refine((v) => !v || /^[+0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number or leave it blank.").transform((v) => (v ? v : null)),
};

const createSchema = z.object({
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, "Handle: 3–30 letters, numbers or underscores."),
  ...profileFields,
});

export async function createBusiness(_: BizState, formData: FormData): Promise<BizState> {
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: String(parsed.error.issues[0]?.path[0] ?? "") };
  const { supabase, user } = await requireUser();
  // No .select() here: the owner membership row is added by a trigger after the insert.
  const { error } = await supabase.from("businesses").insert({ ...parsed.data, created_by: user.id });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/business");
  redirect("/business");
}

export async function updateBusiness(_: BizState, formData: FormData): Promise<BizState> {
  const id = z.string().uuid().safeParse(formData.get("businessId"));
  const parsed = z.object(profileFields).safeParse(Object.fromEntries(formData));
  if (!id.success) return { error: "Invalid business." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: String(parsed.error.issues[0]?.path[0] ?? "") };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("businesses").update(parsed.data).eq("id", id.data);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/business");
  revalidatePath("/businesses", "layout");
  return { ok: true };
}

const listingSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120),
  kind: z.enum(["product", "service"]),
  price_text: optional(40),
  description: optional(1500),
});

export async function addListing(_: BizState, formData: FormData): Promise<BizState> {
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: String(parsed.error.issues[0]?.path[0] ?? "") };
  const { businessId, ...rest } = parsed.data;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("business_listings").insert({
    business_id: businessId, ...rest, status: formData.get("publish") === "on" ? "published" : "draft",
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/business");
  revalidatePath("/businesses", "layout");
  return { ok: true };
}

export async function setListingStatus(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("listingId"));
  const status = z.enum(["draft", "published"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const { supabase } = await requireUser();
  await supabase.from("business_listings").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/business");
  revalidatePath("/businesses", "layout");
}

export async function deleteListing(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("listingId"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  await supabase.from("business_listings").delete().eq("id", id.data);
  revalidatePath("/business");
  revalidatePath("/businesses", "layout");
}

export async function sendEnquiry(_: BizState, formData: FormData): Promise<BizState> {
  const businessId = z.string().uuid().safeParse(formData.get("businessId"));
  const listingRaw = formData.get("listingId");
  const listingId = typeof listingRaw === "string" && listingRaw ? z.string().uuid().safeParse(listingRaw) : null;
  const message = z.string().trim().min(5, "Write at least 5 characters.").max(1000, "Enquiries can be up to 1000 characters.").safeParse(formData.get("message"));
  if (!businessId.success || (listingId && !listingId.success)) return { error: "Invalid request." };
  if (!message.success) return { error: message.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("business_enquiries").insert({
    business_id: businessId.data, listing_id: listingId?.success ? listingId.data : null, sender_id: user.id, message: message.data,
  });
  if (error) return { error: friendly(error.message) };
  return { ok: true };
}

export async function setEnquiryStatus(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("enquiryId"));
  const status = z.enum(["read", "closed"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const { supabase } = await requireUser();
  await supabase.from("business_enquiries").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/business");
}

export async function updateBusinessLogo(_: BizState, formData: FormData): Promise<BizState> {
  const id = z.string().uuid().safeParse(formData.get("businessId"));
  const file = formData.get("logo");
  if (!id.success) return { error: "Invalid business." };
  if (!(file instanceof File)) return { error: "Choose an image first." };
  const { supabase } = await requireUser();
  // Storage policy: only members of this business can write into its folder.
  const { data: before } = await supabase.from("businesses").select("logo_path").eq("id", id.data).single();
  const res = await uploadImage(supabase, "business-logos", id.data, file, 2 * 1024 * 1024);
  if ("error" in res) return { error: res.error };
  const { error } = await supabase.from("businesses").update({ logo_path: res.path }).eq("id", id.data);
  if (error) {
    await supabase.storage.from("business-logos").remove([res.path]);
    return { error: friendly(error.message) };
  }
  const old = before?.logo_path as string | null | undefined;
  if (old && old.startsWith(`${id.data}/`)) await supabase.storage.from("business-logos").remove([old]);
  revalidatePath("/business");
  revalidatePath("/businesses", "layout");
  return { ok: true };
}

export async function removeBusinessLogo(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("businessId"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("businesses").select("logo_path").eq("id", id.data).single();
  await supabase.from("businesses").update({ logo_path: null }).eq("id", id.data);
  const old = data?.logo_path as string | null | undefined;
  if (old && old.startsWith(`${id.data}/`)) await supabase.storage.from("business-logos").remove([old]);
  revalidatePath("/business");
  revalidatePath("/businesses", "layout");
}
