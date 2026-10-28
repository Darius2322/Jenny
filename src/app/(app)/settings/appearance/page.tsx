import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { ThemeChoice } from "@/components/ThemeChoice";

export const metadata: Metadata = { title: "Appearance", robots: { index: false } };

export default async function AppearanceSettings() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  const { data } = await supabase.from("user_preferences").select("theme").eq("user_id", user.id).maybeSingle();
  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Appearance</h1>
      <ThemeChoice initial={(data?.theme as string | undefined) ?? "system"} />
    </>
  );
}
