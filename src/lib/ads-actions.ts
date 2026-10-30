"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/upload";

export type AdState = { error?: string; field?: string; ok?: boolean } | undefined;

const schema = z.object({
  business: z.string().trim().min(2, "Enter your business or brand name.").max(80, "Name is too long."),
  title: z.string().trim().min(3, "Headline must be at least 3 characters.").max(80, "Headline can be up to 80 characters."),
  body: z.string().trim().min(10, "Describe your offer in at least 10 characters.").max(300, "Description can be up to 300 characters."),
  link: z.string().trim().regex(/^https?:\/\/[^\s]{3,300}$/i, "Link must start with http:// or https://"),
  placement: z.enum(["feed", "discover", "gossip"], { errorMap: () => ({ message: "Choose where to show the ad." }) }),
  contact: z.string().trim().min(5, "Enter a phone number or email we can reach you on.").max(120),
});

export async function applyForAd(_: AdState, formData: FormData): Promise<AdState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: String(parsed.error.issues[0]?.path[0] ?? "") };
  if (formData.get("terms") !== "on") return { error: "Please confirm the ad rules.", field: "terms" };
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  let image: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const up = await uploadImage(supabase, "post-media", user.id, file, 3 * 1024 * 1024);
    if ("error" in up) return { error: up.error, field: "image" };
    image = up.path;
  }
  const d = parsed.data;
  const { error } = await supabase.rpc("ad_apply", { p_id: crypto.randomUUID(), p_business: d.business, p_title: d.title, p_body: d.body, p_link: d.link, p_placement: d.placement, p_contact: d.contact, p_image: image });
  if (error) return { error: error.message.includes("rate_limit") ? "You can send 3 applications a day. Try again tomorrow." : "Couldn't send your application. Please try again." };
  revalidatePath("/ads");
  return { ok: true };
}

export async function adEvent(id: string, click: boolean) {
  if (!z.string().uuid().safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.rpc("ad_event", { p_id: id, p_click: click });
}
