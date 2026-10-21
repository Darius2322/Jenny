"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type NewsState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(160),
  summary: z.string().trim().min(20, "Describe the story in at least 20 characters.").max(1500, "Keep the summary under 1500 characters."),
  source_url: z.string().trim().max(500).optional().refine((v) => !v || /^https?:\/\/[^\s]{3,500}$/i.test(v), "Source link must start with http:// or https://").transform((v) => (v ? v : null)),
});

/** Anything submitted is reviewed by a person before it can appear. Nothing is auto-published. */
export async function submitNews(_: NewsState, formData: FormData): Promise<NewsState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("news_submissions").insert({ ...parsed.data, submitter_id: user.id, status: "pending", label: "unverified_submission" });
  if (error) {
    if (error.message.includes("rate_limit_exceeded")) return { error: "You've sent several tips today. Please try again tomorrow." };
    return { error: "Couldn't send your tip. Please try again." };
  }
  return { ok: true };
}
