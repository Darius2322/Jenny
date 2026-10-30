"use client";

import { useKeepForm } from "@/lib/useKeepForm";
import { updateProfile, type ActionState } from "@/lib/actions";

type P = {
  display_name: string; username: string; bio: string | null; location_text: string | null;
  website: string | null; interests: string[]; visibility: string; discoverable: boolean;
};

export function ProfileForm({ profile }: { profile: P }) {
  const [state, onSubmit, pending] = useKeepForm<ActionState>(updateProfile);
  return (
    <form onSubmit={onSubmit} className="space-y-4 px-4 py-5">
      <div>
        <label htmlFor="display_name" className="label">Name</label>
        <input id="display_name" name="display_name" defaultValue={profile.display_name} maxLength={60} required className="field" />
      </div>
      <div>
        <label htmlFor="username" className="label">Username</label>
        <input id="username" name="username" defaultValue={profile.username} maxLength={30} required autoCapitalize="none" className="field" aria-describedby="username-hint" />
        <p id="username-hint" className="mt-1 text-xs text-muted">3–30 characters: letters, numbers, underscores.</p>
      </div>
      <div>
        <label htmlFor="bio" className="label">Bio</label>
        <textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={300} rows={3} className="field py-3" />
      </div>
      <div>
        <label htmlFor="location_text" className="label">Location <span className="font-normal text-muted">(optional, general area only)</span></label>
        <input id="location_text" name="location_text" defaultValue={profile.location_text ?? ""} maxLength={80} placeholder="e.g. Nairobi" className="field" />
      </div>
      <div>
        <label htmlFor="website" className="label">Website <span className="font-normal text-muted">(optional)</span></label>
        <input id="website" name="website" type="url" defaultValue={profile.website ?? ""} maxLength={200} placeholder="https://" className="field" />
      </div>
      <div>
        <label htmlFor="interests" className="label">Interests <span className="font-normal text-muted">(comma separated, up to 15)</span></label>
        <input id="interests" name="interests" defaultValue={profile.interests.join(", ")} placeholder="football, music, farming" className="field" />
      </div>
      <fieldset>
        <legend className="label">Who can see your profile and posts?</legend>
        <label className="flex min-h-[44px] items-center gap-3"><input type="radio" name="visibility" value="public" defaultChecked={profile.visibility === "public"} /> Everyone on Jenny</label>
        <label className="flex min-h-[44px] items-center gap-3"><input type="radio" name="visibility" value="followers" defaultChecked={profile.visibility === "followers"} /> Only followers I approve</label>
      </fieldset>
      <label className="flex min-h-[44px] items-center gap-3">
        <input type="checkbox" name="discoverable" defaultChecked={profile.discoverable} /> Let people find me in search
      </label>
      {state?.error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-medium text-brand-dark dark:text-brand">Profile saved.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
