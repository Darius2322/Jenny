import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyProfileRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  redirect(data ? `/u/${data.username}` : "/settings");
}
