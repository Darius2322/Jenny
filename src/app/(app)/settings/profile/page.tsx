import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { AvatarForm } from "@/components/AvatarForm";
import { CoverForm } from "@/components/CoverForm";

export const metadata: Metadata = { title: "Profile settings", robots: { index: false } };

export default async function ProfileSettings() {
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles")
    .select("avatar_path, cover_path, display_name, username, bio, location_text, website, interests, visibility, discoverable").eq("id", user.id).single();
  return (
    <>
      <h1 className="px-5 pt-5 text-2xl font-extrabold">Profile and photos</h1>
      {profile && <AvatarForm name={profile.display_name} path={profile.avatar_path} />}
      {profile && <CoverForm path={profile.cover_path} />}
      {profile ? <ProfileForm profile={{ ...profile, interests: profile.interests ?? [] }} /> : <p role="alert" className="p-4 text-red-600">Couldn&apos;t load your profile.</p>}
    </>
  );
}
