import { createClient } from "@/lib/supabase/server";
import { AdCard } from "./AdCard";

type Ad = { id: string; business_name: string; title: string; body: string; link_url: string; image_path: string | null };

/** Approved, in-date ads for a placement. Always labelled "Sponsored". Renders nothing when there are none. */
export async function AdSlot({ placement }: { placement: "feed" | "discover" | "gossip" }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ad_active", { p_placement: placement });
  const ad = ((data ?? []) as Ad[])[0];
  if (!ad) return null;
  return <AdCard ad={ad} />;
}
