"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

export type FormState = { error?: string; message?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(60, "Name is too long."),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, "Username: 3–30 letters, numbers or underscores."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
  acceptTerms: z.literal("on", { errorMap: () => ({ message: "You must accept the Terms and Privacy Policy." }) }),
});

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // One generic message: don't reveal whether the account exists.
    return { error: "Incorrect email or password, or the email has not been verified yet." };
  }
  redirect(safeNext(formData.get("next")));
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { email, password, username, displayName } = parsed.data;

  const supabase = await createClient();
  // Username uniqueness is enforced by the DB unique index; if the requested name is taken the
  // signup trigger assigns a temporary "user_xxxx" name that the user changes in profile setup.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/home`,
    },
  });
  if (error) return { error: "We couldn't create that account. Check your details and try again." };

  // Same response whether or not the email was already registered (prevents enumeration).
  return { message: "Check your email for a verification link to finish creating your account." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = z.string().min(10, "Use at least 10 characters.").max(128).safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: "Couldn't update the password. Request a new reset link and try again." };
  redirect("/home");
}
