"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "./supabase-server";

export type LoginState = { error?: string } | undefined;

export async function staffLogin(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };
  redirect("/"); // requireStaff() then sends them to the second-factor step
}

export async function staffLogout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
