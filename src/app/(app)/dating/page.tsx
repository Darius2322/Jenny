import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DatingMatches, type MatchRow } from "@/components/DatingMatches";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { DatingSetup } from "@/components/DatingSetup";
import { DatingDeck, type Candidate } from "@/components/DatingDeck";

export const metadata: Metadata = { title: "Dating", robots: { index: false } };

type Me = { gender: string; looking_for: string[]; bio: string | null; region: string | null; active: boolean; age: number; prompt: string | null; answer: string | null; age_min: number; age_max: number; hobbies: string[] };

export default async function DatingPage({ searchParams }: { searchParams: Promise<{ tab?: string; area?: string }> }) {
  const { tab, area } = await searchParams;
  const supabase = await createClient();
  const { data: meRows } = await supabase.rpc("dating_me2");
  const me = ((meRows ?? []) as Me[])[0] ?? null;
  const active = tab === "matches" ? "matches" : tab === "profile" ? "profile" : "discover";

  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Dating</h1>
      <DiscoverTabs active="dating" />

      {!me ? (
        <>
          <p className="px-5 pt-5 text-lg font-bold">Set up your dating profile</p>
          <DatingSetup initial={null} />
        </>
      ) : (
        <>
          <nav aria-label="Dating sections" className="flex gap-2 px-5 pt-4">
            {([["discover", "Discover"], ["matches", "Matches"], ["profile", "My profile"]] as const).map(([id, label]) => (
              <Link key={id} href={id === "discover" ? "/dating" : `/dating?tab=${id}`} aria-current={active === id ? "page" : undefined}
                className={`inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold ${active === id ? "bg-brand-dark text-white" : "bg-surface text-muted dark:bg-white/10"}`}>{label}</Link>
            ))}
          </nav>
          {active === "discover" && (me.active ? <Deck area={area} /> : <p className="px-6 py-14 text-center text-muted">Your dating profile is paused, so you can&apos;t see or be seen. Unpause it in My profile.</p>)}
          {active === "matches" && <Matches />}
          {active === "profile" && <DatingSetup initial={{ gender: me.gender, looking_for: me.looking_for, bio: me.bio, region: me.region, active: me.active, prompt: me.prompt, answer: me.answer, age_min: me.age_min, age_max: me.age_max, hobbies: me.hobbies }} />}
        </>
      )}
    </>
  );
}

async function Deck({ area }: { area?: string }) {
  const supabase = await createClient();
  const [{ data }, { data: likes }] = await Promise.all([supabase.rpc("dating_discover2", { p_limit: 12, p_region: area ?? null }), supabase.rpc("dating_likes_count")]);
  return (
    <>
      <form className="flex gap-2 px-5 pt-4" action="/dating"><input name="area" defaultValue={area ?? ""} placeholder="Filter by area, e.g. Mombasa" aria-label="Filter by area" className="field !min-h-[40px]" /><button className="btn btn-secondary !min-h-[40px]">Filter</button></form>
      {typeof likes === "number" && likes > 0 && <p className="mx-5 mt-3 rounded-2xl bg-brand-tint px-4 py-2 text-sm font-semibold text-brand-deep dark:bg-brand/15 dark:text-brand">{likes} {likes === 1 ? "person likes" : "people like"} you. Keep swiping to find them.</p>}
      <DatingDeck initial={(data ?? []) as Candidate[]} />
    </>
  );
}

async function Matches() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dating_match_list");
  return <DatingMatches initial={(data ?? []) as MatchRow[]} />;
}
