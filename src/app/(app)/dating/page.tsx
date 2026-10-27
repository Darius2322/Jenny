import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { startConversation } from "@/lib/actions";
import { Avatar } from "@/components/Avatar";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { DatingSetup } from "@/components/DatingSetup";
import { DatingDeck, type Candidate } from "@/components/DatingDeck";

export const metadata: Metadata = { title: "Dating", robots: { index: false } };

type Me = { gender: string; looking_for: string[]; bio: string | null; region: string | null; active: boolean; age: number };
type Match = { user_id: string; username: string; display_name: string; avatar_path: string | null; age: number };

export default async function DatingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: meRows } = await supabase.rpc("dating_me");
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
          {active === "discover" && (me.active ? <Deck /> : <p className="px-6 py-14 text-center text-muted">Your dating profile is paused, so you can&apos;t see or be seen. Unpause it in My profile.</p>)}
          {active === "matches" && <Matches />}
          {active === "profile" && <DatingSetup initial={{ gender: me.gender, looking_for: me.looking_for, bio: me.bio, region: me.region, active: me.active }} />}
        </>
      )}
    </>
  );
}

async function Deck() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dating_discover", { p_limit: 12 });
  return <DatingDeck initial={(data ?? []) as Candidate[]} />;
}

async function Matches() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dating_matches");
  const list = (data ?? []) as Match[];
  if (list.length === 0) return <p className="px-6 py-14 text-center text-muted">No matches yet. When you and someone both like each other, they appear here.</p>;
  return (
    <ul className="mt-3 divide-y divide-line dark:divide-white/10">
      {list.map((m) => (
        <li key={m.user_id} className="flex items-center gap-3 px-5 py-3">
          <Avatar name={m.display_name} path={m.avatar_path} size={52} />
          <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{m.display_name}, {m.age}</span><span className="block truncate text-sm text-muted">@{m.username}</span></span>
          <form action={startConversation}><input type="hidden" name="targetId" value={m.user_id} /><button type="submit" className="btn btn-primary !min-h-[40px]">Message</button></form>
        </li>
      ))}
    </ul>
  );
}
