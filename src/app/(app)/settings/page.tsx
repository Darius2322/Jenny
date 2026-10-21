import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { ProfileForm } from "@/components/ProfileForm";
import { AvatarForm } from "@/components/AvatarForm";
import { CoverForm } from "@/components/CoverForm";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path, cover_path, display_name, username, bio, location_text, website, interests, visibility, discoverable")
    .eq("id", user.id).single();

  return (
    <>
      <h1 className="px-4 pt-5 text-xl font-bold">Settings</h1>
      {profile && <AvatarForm name={profile.display_name} path={profile.avatar_path} />}
      {profile && <CoverForm path={profile.cover_path} />}
      {profile ? <ProfileForm profile={{ ...profile, interests: profile.interests ?? [] }} /> : <p role="alert" className="p-4 text-red-600">Couldn&apos;t load your profile.</p>}
      <div className="border-t border-line px-4 py-5 dark:border-white/10">
        <p className="mb-3 text-sm text-muted">Signed in as {user.email}</p>
        <form action={logout}><button type="submit" className="btn btn-secondary">Sign out</button></form>
      </div>
    </>
  );
}
