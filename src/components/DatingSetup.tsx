"use client";

import { useKeepForm } from "@/lib/useKeepForm";
import { useState, useTransition } from "react";
import { saveDatingProfile2, removeDatingData, type ActionState } from "@/lib/actions";

type Initial = { gender: string; looking_for: string[]; bio: string | null; region: string | null; active: boolean; prompt: string | null; answer: string | null; age_min: number; age_max: number; hobbies: string[] } | null;
const PROMPTS = ["My perfect weekend is…", "You should message me if…", "The way to my heart is…", "A green flag for me is…", "I'm weirdly good at…"];
const OPTIONS = [{ v: "woman", l: "Woman" }, { v: "man", l: "Man" }, { v: "nonbinary", l: "Non-binary" }];

export function DatingSetup({ initial }: { initial: Initial }) {
  const [state, onSubmit, pending] = useKeepForm<ActionState>(saveDatingProfile2);
  const [gone, setGone] = useState(false);
  const [, start] = useTransition();
  const chip = "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm font-medium has-[:checked]:border-brand-dark has-[:checked]:bg-brand-tint has-[:checked]:text-brand-deep dark:border-white/15 dark:has-[:checked]:bg-brand/15 dark:has-[:checked]:text-brand";
  return (
    <form onSubmit={onSubmit} className="space-y-5 px-5 py-5">
      {!initial && (
        <p className="rounded-2xl bg-brand-tint p-4 text-sm text-brand-deep dark:bg-brand/15 dark:text-brand">
          Dating is optional and for adults only. Only your first name, age, photo, area and the details below are shown to people who match your preferences. Your date of birth is never shown.
        </p>
      )}
      <fieldset>
        <legend className="label">Date of birth</legend>
        <div className="grid grid-cols-3 gap-2">
          <input name="day" inputMode="numeric" maxLength={2} placeholder="DD" aria-label="Day" required className="field text-center" autoComplete="bday-day" />
          <input name="month" inputMode="numeric" maxLength={2} placeholder="MM" aria-label="Month" required className="field text-center" autoComplete="bday-month" />
          <input name="year" inputMode="numeric" maxLength={4} placeholder="YYYY" aria-label="Year" required className="field text-center" autoComplete="bday-year" />
        </div>
        {initial && <p className="mt-1 text-xs text-muted">Re-enter your date of birth to save changes.</p>}
      </fieldset>
      <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="adult" /> I confirm I am 18 or older.</label>
      <fieldset>
        <legend className="label">I am</legend>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => <label key={o.v} className={chip}><input type="radio" name="gender" value={o.v} defaultChecked={initial?.gender === o.v} required />{o.l}</label>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">I&apos;d like to meet</legend>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => <label key={o.v} className={chip}><input type="checkbox" name="lookingFor" value={o.v} defaultChecked={initial?.looking_for.includes(o.v)} />{o.l}</label>)}
        </div>
      </fieldset>
      <div>
        <label htmlFor="region" className="label">General area <span className="font-normal text-muted">(optional, e.g. Nairobi)</span></label>
        <input id="region" name="region" defaultValue={initial?.region ?? ""} maxLength={60} className="field" />
      </div>
      <div>
        <label htmlFor="dbio" className="label">About me <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="dbio" name="bio" rows={3} maxLength={300} defaultValue={initial?.bio ?? ""} className="field py-3" />
      </div>
      <div>
        <label htmlFor="hobbies" className="label">Hobbies <span className="font-normal text-muted">(comma separated, up to 8)</span></label>
        <input id="hobbies" name="hobbies" defaultValue={initial?.hobbies.join(", ") ?? ""} placeholder="football, travel, cooking" className="field" />
      </div>
      <div>
        <label htmlFor="prompt" className="label">Conversation starter <span className="font-normal text-muted">(optional)</span></label>
        <select id="prompt" name="prompt" defaultValue={initial?.prompt ?? ""} className="field"><option value="">None</option>{PROMPTS.map((q) => <option key={q} value={q}>{q}</option>)}</select>
        <textarea name="answer" aria-label="Your answer" rows={2} maxLength={200} defaultValue={initial?.answer ?? ""} placeholder="Your answer" className="field mt-2 py-3" />
      </div>
      <fieldset>
        <legend className="label">Age range I&apos;d like to meet</legend>
        <div className="grid grid-cols-2 gap-2">
          <input name="ageMin" inputMode="numeric" maxLength={2} aria-label="Youngest" defaultValue={initial?.age_min ?? 18} className="field text-center" />
          <input name="ageMax" inputMode="numeric" maxLength={2} aria-label="Oldest" defaultValue={initial?.age_max ?? 99} className="field text-center" />
        </div>
      </fieldset>
      {initial && <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="hidden" defaultChecked={!initial.active} /> Pause my dating profile (hide me from others)</label>}
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        <li>Your Jenny profile photo is used. Add one in Settings.</li>
        <li>Never send money or share private details with someone you haven&apos;t met. Meet in public places.</li>
        <li>You can block or report anyone from their card.</li>
      </ul>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-brand-tint p-3 text-sm font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand">Saved.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Saving…" : initial ? "Save changes" : "Create dating profile"}</button>
      {initial && (gone ? <p role="status" className="text-center text-sm text-muted">Your dating details were cleared and your profile is hidden.</p> :
        <button type="button" onClick={() => { if (confirm("Clear your dating profile details and hide you? Your matches stay in your DMs.")) start(async () => { if (await removeDatingData()) setGone(true); }); }} className="block w-full text-center text-sm text-red-600 underline">Remove my dating data</button>)}
    </form>
  );
}
